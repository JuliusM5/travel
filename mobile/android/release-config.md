# Android Release Configuration

## 1. Keystore Generation

### Create Release Keystore
```bash
cd android/app
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore travelmate-release.keystore \
  -alias travelmate \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Keystore Configuration
Create `android/keystore.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=travelmate
storeFile=travelmate-release.keystore
```

**IMPORTANT**: Never commit keystore files or passwords!

## 2. Gradle Configuration

### Update `android/app/build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## 3. ProGuard Rules

### Update `android/app/proguard-rules.pro`:
```proguard
# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# In-app billing
-keep class com.android.vending.billing.**

# Notifee
-keep class io.invertase.notifee.** { *; }

# React Native Navigation
-keep class com.reactnativenavigation.** { *; }
```

## 4. Build Release APK

### Generate APK
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Generate AAB (Recommended)
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 5. Google Play Console Setup

### App Details
- **App name**: TravelMate
- **Short description**: Smart flight price alerts & trip planner
- **Full description**: See app-store-description.md
- **Category**: Travel & Local
- **Content rating**: Everyone

### Store Listing Assets
- **App icon**: 512 × 512 PNG
- **Feature graphic**: 1024 × 500 PNG
- **Screenshots**: Min 2, Max 8 per device type
  - Phone: 1080 × 1920 (or similar)
  - Tablet: 1200 × 1920 (or similar)

### Pricing & Distribution
- **Price**: Free
- **Countries**: All countries
- **Contains ads**: No
- **In-app purchases**: Yes

## 6. Release Process

### Internal Testing
```bash
# Upload to Internal Testing track
fastlane supply --track internal --aab app-release.aab
```

### Closed Testing (Beta)
1. Upload AAB to Closed Testing
2. Create tester list
3. Wait for review (usually 1-2 hours)

### Production Release
1. Promote from beta or upload new
2. Rollout percentage (start with 10%)
3. Monitor crash reports
4. Increase rollout gradually

## 7. Pre-Launch Report

### Enable Pre-launch Testing
- Tests on various devices
- Identifies crashes
- Screenshots on different screens
- Performance report

### Common Issues
- ANRs (App Not Responding)
- Crashes on specific devices
- Accessibility problems
- Performance issues

## 8. Version Management

### Version Code Formula
```gradle
def versionMajor = 1
def versionMinor = 0
def versionPatch = 0
def versionBuild = 1

android {
    defaultConfig {
        versionCode versionMajor * 10000 + versionMinor * 100 + versionPatch * 10 + versionBuild
        versionName "${versionMajor}.${versionMinor}.${versionPatch}"
    }
}
```

## 9. Release Checklist

### Code Preparation
- [ ] Remove all debug code
- [ ] Update version code/name
- [ ] Test release build locally
- [ ] Verify all permissions needed
- [ ] Update ProGuard rules

### Assets
- [ ] App icon (all sizes)
- [ ] Feature graphic
- [ ] Screenshots (phone & tablet)
- [ ] Promotional video (optional)
- [ ] Store listing translations

### Testing
- [ ] Test on minimum SDK device
- [ ] Test on latest Android version
- [ ] Test all IAP flows
- [ ] Verify deep links work
- [ ] Check notification handling

### Legal
- [ ] Privacy Policy URL accessible
- [ ] Terms of Service URL accessible
- [ ] GDPR compliance
- [ ] Data Safety form completed

## 10. Post-Release

### Monitoring
```bash
# Check vitals in Play Console
# - ANR rate < 0.47%
# - Crash rate < 1.09%
```

### Responding to Issues
1. Monitor reviews daily
2. Respond to user feedback
3. Fix critical bugs immediately
4. Plan regular updates

### Updates
```bash
# Increment versionCode
# Update versionName
./gradlew bundleRelease
# Upload to Play Console
```

## 11. Optimization

### App Size Reduction
```gradle
android {
    buildTypes {
        release {
            ndk {
                abiFilters "armeabi-v7a", "arm64-v8a"
            }
        }
    }
}
```

### Performance
- Enable R8 (successor to ProGuard)
- Use Android App Bundle
- Implement dynamic feature modules
- Optimize images with WebP

## 12. Marketing

### Store Listing Optimization
- A/B test different screenshots
- Seasonal updates
- Localize for top markets
- Use all keyword space

### Promotional Options
- Google Play Featuring
- Promotional pricing
- Install campaigns
- Pre-registration