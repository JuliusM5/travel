const express = require('express');
const cors = require('cors');
const Amadeus = require('amadeus');
const Stripe = require('stripe');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Amadeus with your credentials
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

// JWT secret for temporary session tokens
const JWT_SECRET = process.env.JWT_SECRET || 'travelmate-secret-key';

// Store for deduplication (in production, use Redis)
const priceCache = new Map();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Batch routes for efficient API usage
function batchRoutes(routes) {
  const batches = [];
  for (let i = 0; i < routes.length; i += 6) {
    batches.push(routes.slice(i, i + 6));
  }
  return batches;
}

// Get cached price or fetch new
async function getPriceForRoute(origin, destination, date) {
  const routeKey = `${origin}-${destination}-${date}`;
  const cached = priceCache.get(routeKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }
  
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: '1',
      max: '1'
    });
    
    const price = response.data[0]?.price?.total || null;
    if (price) {
      priceCache.set(routeKey, {
        price: parseFloat(price),
        timestamp: Date.now()
      });
    }
    
    return price ? parseFloat(price) : null;
  } catch (error) {
    console.error(`Error fetching price for ${origin}-${destination}:`, error.message);
    return null;
  }
}

// Main endpoint - anonymous price checking
app.post('/api/prices', async (req, res) => {
  try {
    const { routes } = req.body;
    
    if (!routes || !Array.isArray(routes)) {
      return res.status(400).json({ error: 'Routes array required' });
    }
    
    // Process routes in batches
    const prices = {};
    const batches = batchRoutes(routes);
    
    for (const batch of batches) {
      // Process batch in parallel
      const batchPromises = batch.map(async (route) => {
        const [origin, destination, date] = route.split('|');
        const price = await getPriceForRoute(origin, destination, date || getDefaultDate());
        return { route: `${origin}-${destination}`, price };
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ route, price }) => {
        prices[route] = price;
      });
      
      // Small delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    res.json({ prices });
  } catch (error) {
    console.error('Price check error:', error);
    res.status(500).json({ error: 'Failed to check prices' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    cacheSize: priceCache.size,
    timestamp: new Date().toISOString()
  });
});

// Helper function for default date (7 days from now)
function getDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

// Cleanup old cache entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of priceCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      priceCache.delete(key);
    }
  }
}, CACHE_DURATION);

// ============= STRIPE SUBSCRIPTION ENDPOINTS =============

// Create a checkout session for new subscription
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { email, successUrl, cancelUrl } = req.body;
    
    // Create or retrieve customer
    let customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({ email });
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Your subscription price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.FRONTEND_URL}/alerts?subscription=success`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/alerts?subscription=cancelled`,
      metadata: {
        email
      }
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Verify subscription status
app.post('/api/verify-subscription', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (customers.data.length === 0) {
      return res.json({ isSubscribed: false });
    }
    
    const customer = customers.data[0];
    
    // Check active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });
    
    const isSubscribed = subscriptions.data.length > 0;
    
    // Generate a temporary session token
    const sessionToken = jwt.sign(
      { email, isSubscribed, customerId: customer.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      isSubscribed,
      sessionToken,
      subscription: isSubscribed ? subscriptions.data[0] : null
    });
  } catch (error) {
    console.error('Subscription verification error:', error);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
});

// Cancel subscription
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { sessionToken } = req.body;
    
    // Verify session token
    const decoded = jwt.verify(sessionToken, JWT_SECRET);
    
    if (!decoded.isSubscribed) {
      return res.status(400).json({ error: 'No active subscription' });
    }
    
    // Get customer's active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: decoded.customerId,
      status: 'active',
      limit: 1
    });
    
    if (subscriptions.data.length === 0) {
      return res.status(400).json({ error: 'No active subscription found' });
    }
    
    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(
      subscriptions.data[0].id,
      { cancel_at_period_end: true }
    );
    
    res.json({ 
      success: true, 
      cancelAt: subscription.cancel_at,
      currentPeriodEnd: subscription.current_period_end 
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Create customer portal session for subscription management
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { sessionToken } = req.body;
    
    // Verify session token
    const decoded = jwt.verify(sessionToken, JWT_SECRET);
    
    const session = await stripe.billingPortal.sessions.create({
      customer: decoded.customerId,
      return_url: `${process.env.FRONTEND_URL}/profile`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Webhook endpoint for Stripe events
// Note: This must be before the general express.json() middleware
app.post('/api/stripe-webhook', 
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        console.log('Subscription event:', event.type, subscription.id);
        // You could update a database here if needed
        break;
        
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout completed:', session.id);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
  }
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TravelMate price server running on port ${PORT}`);
});