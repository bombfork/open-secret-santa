# Android App Links Configuration

This directory contains the `assetlinks.json` file required for Android App Links verification.

## What is assetlinks.json?

The `assetlinks.json` file is used by Android to verify that your app is authorized to open links for your domain (`secret-santa.bombfork.net`). This enables deep linking - when users click on a Secret Santa link, it will automatically open in the app if installed, otherwise it falls back to the browser.

## Getting SHA-256 Fingerprints

You need to add the SHA-256 fingerprints of your app's signing certificates to the `assetlinks.json` file.

### Debug Keystore Fingerprint

For development and testing, get the debug keystore fingerprint:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep "SHA256:"
```

This will output something like:
```
SHA256: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99
```

### Release Keystore Fingerprint

For production releases, get the release keystore fingerprint:

```bash
keytool -list -v -keystore /path/to/your/release.keystore -alias your-key-alias | grep "SHA256:"
```

You'll be prompted for the keystore password. The output format is the same as above.

### Updating assetlinks.json

1. Copy the SHA-256 fingerprint (the colon-separated hex string)
2. Replace the placeholder values in `assetlinks.json`:
   - Replace `REPLACE_WITH_DEBUG_KEYSTORE_SHA256_FINGERPRINT` with your debug fingerprint
   - Replace `REPLACE_WITH_RELEASE_KEYSTORE_SHA256_FINGERPRINT` with your release fingerprint

Example:
```json
"sha256_cert_fingerprints": [
  "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99",
  "11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF"
]
```

**Note:** You can include multiple fingerprints (debug and release) in the same array.

## Deploying to Production

Once you've updated `assetlinks.json` with the correct fingerprints:

1. Commit the changes to the repository
2. Push to the main branch
3. GitHub Actions will automatically deploy the file to GitHub Pages
4. The file must be accessible at: `https://secret-santa.bombfork.net/.well-known/assetlinks.json`

## Verifying the Configuration

### Check File Accessibility

Verify the file is accessible via:
```bash
curl https://secret-santa.bombfork.net/.well-known/assetlinks.json
```

### Test App Links on Android

1. Build and install the app on an Android device
2. Open a Secret Santa link in a browser or messaging app
3. Android should prompt to open the link in the app, or open it automatically

### Troubleshooting

If App Links are not working:

1. **Check Domain Verification**: Go to Android Settings → Apps → Your App → Open by default. It should show "Verified links".

2. **Test with adb**: Use the App Links Assistant in Android Studio or test manually:
   ```bash
   adb shell pm get-app-links com.bombfork.opensecretasanta
   ```

3. **Clear Verification**: If needed, clear and re-verify:
   ```bash
   adb shell pm set-app-links --package com.bombfork.opensecretasanta 0 all
   adb shell pm verify-app-links --re-verify com.bombfork.opensecretasanta
   ```

4. **Check Logs**: Monitor logcat for verification errors:
   ```bash
   adb logcat | grep -i "app.*link"
   ```

## Additional Resources

- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [Verify Android App Links](https://developer.android.com/training/app-links/verify-android-applinks)
- [Statement List Generator](https://developers.google.com/digital-asset-links/tools/generator)
