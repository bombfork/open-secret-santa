# Android App Links Deep Linking Documentation

This document describes the Android App Links implementation for the Open Secret Santa app.

## Overview

Android App Links enable the app to handle `https://secret-santa.bombfork.net/*` URLs directly. When a user clicks on a Secret Santa link:
- If the app is installed → Opens in the app
- If the app is not installed → Opens in the browser

This provides a seamless experience for sharing Secret Santa assignments.

## Architecture

### Components

1. **Domain Verification** (`.well-known/assetlinks.json`)
   - Hosted on GitHub Pages at `https://secret-santa.bombfork.net/.well-known/assetlinks.json`
   - Contains SHA-256 fingerprints of the app's signing certificates
   - Allows Android to verify the app is authorized to handle these URLs

2. **Android Configuration** (`android/app/src/main/AndroidManifest.xml`)
   - Intent filter with `android:autoVerify="true"` for automatic verification
   - Handles `https://secret-santa.bombfork.net/*` URLs
   - Routes to MainActivity

3. **Capacitor Configuration** (`capacitor.config.json`)
   - Sets `androidScheme` to "https" to enable HTTPS URLs
   - Hostname set to "secret-santa.bombfork.net"

4. **JavaScript Handler** (`js/deeplink.js`)
   - Listens for Capacitor `appUrlOpen` events
   - Parses URL parameters and routes to appropriate view
   - Handles both participant and admin URLs

## How It Works

### User Flow

1. User receives a Secret Santa link (e.g., `https://secret-santa.bombfork.net/?data=...&user=Alice`)
2. User clicks the link on their Android device
3. Android checks if app is installed and verified for this domain
4. If verified, Android opens the link in the app
5. Capacitor fires an `appUrlOpen` event with the URL
6. `deeplink.js` handles the event and routes to the appropriate view
7. User sees their Secret Santa assignment in the app

### URL Routing

The app handles two types of URLs:

**Participant URLs:**
```
https://secret-santa.bombfork.net/?data=BASE64_DATA&user=ParticipantName
```
- Shows single assignment (who the participant is giving to)
- Handled by `setupViewMode()` → displays `viewParticipant` page

**Admin URLs:**
```
https://secret-santa.bombfork.net/?data=BASE64_DATA&admin=true
```
- Requires password authentication
- Shows all assignments
- Handled by `setupViewMode()` → displays `viewAdmin` page

### Code Flow

```javascript
// 1. App starts or receives deep link
initDeepLinking((params) => {
  // 2. Deep link event handler in main.js
  handleDeepLinkNavigation(
    params,           // {data, admin, user}
    setupViewMode,    // Existing routing logic
    showPage,         // Page navigation
    showError,        // Error handling
    goToLanding,      // Fallback
    () => t("validation.invalidUrl")
  );
});

// 3. deeplink.js extracts parameters from URL
const url = new URL(event.url);
const params = {
  data: url.searchParams.get("data"),
  admin: url.searchParams.get("admin"),
  user: url.searchParams.get("user")
};

// 4. Reuses existing view.js routing logic
const viewType = setupViewMode(params, goToLanding);

// 5. Shows appropriate page
if (viewType === "participant") {
  showPage("viewParticipant");
} else if (viewType === "admin") {
  showPage("viewAdmin");
}
```

## Setup Instructions

### 1. Get Your App's SHA-256 Fingerprints

#### Debug Fingerprint
```bash
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android \
  | grep "SHA256:"
```

#### Release Fingerprint
```bash
keytool -list -v -keystore /path/to/your/release.keystore \
  -alias your-key-alias \
  | grep "SHA256:"
```

### 2. Update assetlinks.json

Edit `.well-known/assetlinks.json` and replace the placeholders with your actual fingerprints:

```json
"sha256_cert_fingerprints": [
  "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99",
  "11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF"
]
```

### 3. Deploy to GitHub Pages

```bash
git add .well-known/assetlinks.json
git commit -m "feat: add Android App Links configuration"
git push origin main
```

GitHub Actions will automatically deploy the file.

### 4. Verify Deployment

```bash
curl https://secret-santa.bombfork.net/.well-known/assetlinks.json
```

You should see your assetlinks.json with the correct fingerprints.

### 5. Build and Test the Android App

```bash
# Sync Capacitor files
npm run cap:sync

# Open Android Studio
npm run cap:open:android

# Build and run the app
```

## Testing

### Manual Testing

1. **Install the app** on an Android device or emulator
2. **Send yourself a test link** via email, messaging app, or adb:
   ```bash
   adb shell am start -a android.intent.action.VIEW \
     -d "https://secret-santa.bombfork.net/?data=TEST_DATA&user=TestUser"
   ```
3. **Click the link** and verify it opens in the app
4. **Check the view** displays correctly (participant or admin view)

### Verification Commands

Check domain verification status:
```bash
adb shell pm get-app-links com.bombfork.opensecretasanta
```

Expected output:
```
com.bombfork.opensecretasanta:
  ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  Signatures: [...]
  Domain verification state:
    secret-santa.bombfork.net: verified
```

### Troubleshooting

#### App Links Not Working

1. **Check verification status**:
   ```bash
   adb shell pm get-app-links com.bombfork.opensecretasanta
   ```

2. **Re-verify the domain**:
   ```bash
   adb shell pm verify-app-links --re-verify com.bombfork.opensecretasanta
   ```

3. **Check logs**:
   ```bash
   adb logcat | grep -i "app.*link"
   ```

4. **Manually verify assetlinks.json**:
   - Visit `https://secret-santa.bombfork.net/.well-known/assetlinks.json`
   - Verify it contains your app's package name and fingerprints
   - Check that the JSON is valid

#### Link Opens in Browser Instead of App

1. **Reset app link preferences**:
   - Go to Android Settings → Apps → Your App → Open by default
   - Clear defaults and try again

2. **Force verification**:
   ```bash
   adb shell pm set-app-links --package com.bombfork.opensecretasanta 0 all
   adb shell pm verify-app-links --re-verify com.bombfork.opensecretasanta
   ```

#### Deep Link Not Routing Correctly

1. **Check logs** in Chrome DevTools (for web debugging):
   - Open chrome://inspect
   - Select your device and app
   - Check console for errors

2. **Verify Capacitor is loaded**:
   - Open DevTools console
   - Type `window.Capacitor`
   - Should return an object with platform info

## Browser Fallback

When the app is not installed, the link opens in the browser normally. The existing web app handles the URL parameters and displays the appropriate view. This provides a seamless experience whether the app is installed or not.

## Security Considerations

- URLs contain Base64-encoded data that can be decoded by anyone
- This implementation uses the honor system (see CLAUDE.md)
- App Links verification prevents unauthorized apps from intercepting the links
- Domain verification ensures only your app with the correct signing certificate can handle these URLs

## Additional Resources

- [Android App Links Guide](https://developer.android.com/training/app-links)
- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)
- See `.well-known/README.md` for more detailed instructions
