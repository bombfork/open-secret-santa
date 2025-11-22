# Android Build Setup

This document provides instructions for generating signing keys and configuring automated Android APK builds for the Open Secret Santa application.

## Overview

The project uses GitHub Actions to automatically build Android APKs:
- **Debug APKs**: Built on pull requests and pushes to main (for testing)
- **Release APKs**: Built on tagged releases (for production distribution)

## Generating a Release Signing Key

To build signed release APKs, you need to generate a keystore file. This is a one-time setup.

### Step 1: Generate the Keystore

Run the following command to create a new keystore:

```bash
keytool -genkey -v -keystore release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias secret-santa-release
```

You will be prompted for:
- **Keystore password**: Choose a strong password (you'll need this later)
- **Key password**: Choose a strong password (can be the same as keystore password)
- **Your name**: Can be your organization name or personal name
- **Organizational unit**: Optional (e.g., "Development")
- **Organization**: Optional (e.g., "Bombfork")
- **City/Locality**: Your city
- **State/Province**: Your state/province
- **Country code**: Two-letter country code (e.g., "US")

This creates a file named `release.keystore` in your current directory.

**IMPORTANT**:
- Keep this file safe and secure
- Never commit this file to version control
- Store it in a secure password manager or secure storage
- If you lose this file, you cannot update your app in the Play Store

### Step 2: Extract SHA-256 Fingerprint (for App Links)

To enable Android App Links, you need to add your app's SHA-256 fingerprint to `.well-known/assetlinks.json`.

Extract the SHA-256 fingerprint:

```bash
keytool -list -v -keystore release.keystore -alias secret-santa-release
```

Enter your keystore password when prompted. Look for the SHA-256 fingerprint in the output:

```
Certificate fingerprints:
     SHA1: AA:BB:CC:DD:...
     SHA256: 11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00
```

Copy the SHA-256 value (the long string with colons).

### Step 3: Update assetlinks.json

Edit `.well-known/assetlinks.json` and add your SHA-256 fingerprint:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.bombfork.opensecretasanta",
      "sha256_cert_fingerprints": [
        "11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00"
      ]
    }
  }
]
```

Replace the fingerprint with your actual SHA-256 value. Commit and push this change.

For more details on App Links, see [DEEP_LINKING.md](DEEP_LINKING.md).

### Step 4: Encode Keystore as Base64

GitHub Secrets cannot store binary files directly. Encode your keystore as Base64:

**On Linux/macOS:**
```bash
base64 release.keystore > release.keystore.base64
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) | Out-File -Encoding ASCII release.keystore.base64
```

This creates a text file `release.keystore.base64` containing the encoded keystore.

## Configuring GitHub Secrets

To enable automated release builds, you need to add the following secrets to your GitHub repository.

### Required Secrets

Navigate to your repository on GitHub: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

Add these four secrets:

1. **ANDROID_KEYSTORE_BASE64**
   - Open `release.keystore.base64` in a text editor
   - Copy the entire contents (should be a long string)
   - Paste as the secret value

2. **ANDROID_KEYSTORE_PASSWORD**
   - The keystore password you chose during keystore generation

3. **ANDROID_KEY_ALIAS**
   - Value: `secret-santa-release` (or whatever alias you used)

4. **ANDROID_KEY_PASSWORD**
   - The key password you chose during keystore generation

### Verifying Setup

After adding the secrets:
1. Create a git tag (e.g., `git tag v1.0.0 && git push origin v1.0.0`)
2. Check GitHub Actions to see if the workflow runs successfully
3. If successful, a signed release APK will be attached to the GitHub Release

## Build Workflow

The Android build workflow (`.github/workflows/android-build.yml`) automatically:

### On Pull Requests
- Builds a debug APK for testing
- Uploads APK as a workflow artifact
- No signing required

### On Push to Main
- Builds a debug APK for testing
- Uploads APK as a workflow artifact
- No signing required

### On Tagged Releases (v*)
- Builds a signed release APK using the keystore from secrets
- Uploads APK as a workflow artifact
- Attaches APK to the GitHub Release
- Ready for distribution

## Manual Build Commands

If you need to build locally:

### Debug Build
```bash
cd android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build (requires keystore)
```bash
cd android
./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

Note: For local release builds, you need to configure signing in `android/app/build.gradle` or pass signing parameters via command line.

## Troubleshooting

### "Keystore was tampered with, or password was incorrect"
- Double-check the `ANDROID_KEYSTORE_PASSWORD` secret
- Verify the Base64 encoding is correct
- Ensure the keystore file wasn't corrupted during encoding

### "Could not find key with alias"
- Verify the `ANDROID_KEY_ALIAS` secret matches your keystore alias
- List aliases in your keystore: `keytool -list -keystore release.keystore`

### "APK not signed"
- Ensure all four GitHub Secrets are configured
- Check the GitHub Actions logs for error messages
- Verify the workflow is triggered by a tag matching `v*`

### "App Links not working"
- Verify SHA-256 fingerprint in `.well-known/assetlinks.json` matches your release keystore
- Ensure the file is deployed to `https://secret-santa.bombfork.net/.well-known/assetlinks.json`
- Test with: `curl https://secret-santa.bombfork.net/.well-known/assetlinks.json`
- See [DEEP_LINKING.md](DEEP_LINKING.md) for more troubleshooting steps

## Security Best Practices

1. **Never commit the keystore file** to version control
2. **Store keystore backup securely** (password manager, encrypted storage)
3. **Use strong passwords** for keystore and key
4. **Rotate secrets** if compromised
5. **Limit access** to GitHub repository settings/secrets
6. **Keep keystore validity high** (10000 days = ~27 years)

## Additional Resources

- [Android App Signing Documentation](https://developer.android.com/studio/publish/app-signing)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
