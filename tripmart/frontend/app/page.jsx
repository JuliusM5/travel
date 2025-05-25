'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [apiStatus, setApiStatus] = useState('Checking...')

  useEffect(() => {
    // Test backend connection
    fetch('http://localhost:5000')
      .then(res => res.json())
      .then(data => {
        setApiStatus(`✅ Backend Connected: ${data.message}`)
      })
      .catch(err => {
        setApiStatus(`❌ Backend Error: ${err.message}`)
      })
  }, [])

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
          ✈️ TripSmart
        </h1>
        
        <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>
          Travel Planning Made Easy
        </p>

        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <h3>🔗 Connection Status:</h3>
          <p>{apiStatus}</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem' }}>🚨</div>
            <h4>Smart Alerts</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Get notified when flight prices drop
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem' }}>🗺️</div>
            <h4>Trip Planning</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Organize your perfect itinerary
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem' }}>👥</div>
            <h4>Collaboration</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Plan trips together with friends
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '10px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🚀 Get Started
          </button>

          <button style={{
            background: 'transparent',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            padding: '15px 30px',
            borderRadius: '10px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)'
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'transparent'
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
          }}
          >
            📖 Learn More
          </button>
        </div>

        <div style={{
          marginTop: '30px',
          fontSize: '0.9rem',
          opacity: 0.7
        }}>
          <p>🔧 Development Mode</p>
          <p>Frontend: localhost:3000 | Backend: localhost:5000</p>
        </div>
      </div>
    </div>
  )
}