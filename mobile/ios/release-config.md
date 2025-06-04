# iOS Release Configuration

## 1. Code Signing Setup

### Development Team
1. Open `ios/TravelMate.xcworkspace` in Xcode
2. Select the TravelMate target
3. Go to "Signing & Capabilities"
4. Select your Development Team
5. Enable "Automatically manage signing"

### Bundle Identifier
- Production: `com.travelmate.app`
- Development: `com.travelmate.app.dev`

## 2. Build Configuration

### Archive Settings
```bash
# Clean build
cd ios
xcodebuild clean -workspace TravelMate.xcworkspace -scheme TravelMate

# Create archive
xcodebuild archive \
  -workspace TravelMate.xcworkspace \
  -scheme TravelMate \
  -configuration Release \
  -archivePath ./build/TravelMate.xcarchive
```

### Export Options Plist
Create `ios/ExportOptions.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>signingCertificate</key>
    <string>Apple Distribution</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.travelmate.app</key>
        <string>TravelMate App Store</string>
    </dict>
</dict>
</plist>
```

## 3. App Store Connect Setup

### App Information
- **App Name**: TravelMate
- **Subtitle**: Smart Flight Price Alerts
- **Primary Category**: Travel
- **Secondary Category**: Productivity

### Pricing
- **Base Price**: Free
- **In-App Purchase**: TravelMate Pro ($6.99/month)

### Age Rating
- **4+** (No objectionable content)

### App Review Information
- **Demo Account**: demo@travelmate.app / demo123
- **Notes**: "The app works without login. Price alerts use live data from Amadeus API."

## 4. Build and Upload

### Using Fastlane
```bash
# Install fastlane
gem install fastlane

# Initialize
cd ios
fastlane init

# Create Fastfile
fastlane release
```

### Manual Upload
1. Open Xcode
2. Product → Archive
3. Window → Organizer
4. Select archive → Distribute App
5. App Store Connect → Upload

## 5. TestFlight Setup

### Internal Testing
1. Upload build to App Store Connect
2. Add internal testers (up to 100)
3. No review required

### External Testing
1. Add build to external testing
2. Fill in test information
3. Submit for Beta App Review
4. Add up to 10,000 testers

## 6. Metadata Preparation

### Screenshots (Required Sizes)
- 6.5" Display: 1242 × 2688 pixels
- 5.5" Display: 1242 × 2208 pixels
- iPad Pro 12.9": 2048 × 2732 pixels

### App Preview Video (Optional)
- Format: MP4, H.264
- Duration: 15-30 seconds
- Include captions

### Keywords (100 characters max)
```
flight,deals,price,alert,travel,trip,planner,cheap,flights,tracker,vacation,airfare,booking,save
```

## 7. Pre-Launch Checklist

- [ ] App icon in all required sizes
- [ ] Launch screen configured
- [ ] Version and build number updated
- [ ] Remove all console.log statements
- [ ] Enable crash reporting (Crashlytics)
- [ ] Test on real devices
- [ ] Check memory usage
- [ ] Verify all permissions used
- [ ] Update support URL
- [ ] Create demo video
- [ ] Prepare review notes

## 8. Common Rejection Reasons

### Avoid These:
1. **Insufficient Information**: Provide detailed review notes
2. **Broken Functionality**: Test all features thoroughly
3. **Placeholder Content**: Remove all Lorem Ipsum
4. **Missing Privacy Policy**: Must be accessible
5. **Subscription Issues**: Clear pricing and terms
6. **Performance**: Must not crash or hang

## 9. Post-Release

### Monitoring
- Watch crash reports
- Monitor reviews
- Track download metrics
- Check subscription conversions

### Updates
- Bug fixes: 1-2 weeks
- Features: Monthly
- Seasonal updates
- Respond to reviews

## 10. Marketing Materials

### Press Kit
- App icon (high-res)
- Screenshots
- Description
- Promo video
- Press release

### ASO (App Store Optimization)
- Research keywords
- A/B test screenshots
- Update seasonally
- Monitor rankings