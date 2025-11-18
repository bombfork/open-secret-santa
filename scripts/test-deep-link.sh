#!/bin/bash

# Test script for Android App Links deep linking
# Usage: ./scripts/test-deep-link.sh [URL]

set -e

PACKAGE_NAME="com.bombfork.opensecretasanta"
DEFAULT_TEST_URL="https://secret-santa.bombfork.net/?data=eyJzZWVkIjoidGVzdCIsImFzc2lnbm1lbnRzIjoiW3tcImdpdmVyXCI6XCJBbGljZVwiLFwicmVjZWl2ZXJcIjpcIkJvYlwifV0iLCJwYXNzd29yZEhhc2giOiIxMjM0NTYifQ&user=Alice"

TEST_URL="${1:-$DEFAULT_TEST_URL}"

echo "=========================================="
echo "Android App Links Test Script"
echo "=========================================="
echo ""
echo "Package: $PACKAGE_NAME"
echo "Test URL: $TEST_URL"
echo ""

# Check if device is connected
echo "Checking for connected devices..."
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device or emulator connected"
    echo "   Please connect a device or start an emulator"
    exit 1
fi
echo "✅ Device connected"
echo ""

# Check if app is installed
echo "Checking if app is installed..."
if ! adb shell pm list packages | grep -q "$PACKAGE_NAME"; then
    echo "❌ App is not installed"
    echo "   Please install the app first: npm run cap:run:android"
    exit 1
fi
echo "✅ App is installed"
echo ""

# Check domain verification status
echo "Checking domain verification status..."
VERIFICATION_STATUS=$(adb shell pm get-app-links "$PACKAGE_NAME" 2>/dev/null || echo "Error getting status")
echo "$VERIFICATION_STATUS"
echo ""

if echo "$VERIFICATION_STATUS" | grep -q "verified"; then
    echo "✅ Domain is verified"
else
    echo "⚠️  Domain verification not complete"
    echo "   This is normal for debug builds or first install"
    echo "   The link will still work, but may prompt for app selection"
fi
echo ""

# Test the deep link
echo "Testing deep link..."
echo "Launching URL: $TEST_URL"
echo ""

adb shell am start -a android.intent.action.VIEW -d "$TEST_URL"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deep link command executed successfully"
    echo "   Check your device to see if the app opened"
    echo ""
    echo "Expected behavior:"
    echo "  - App should open (or prompt to open)"
    echo "  - Should show the participant or admin view"
    echo "  - URL parameters should be parsed correctly"
else
    echo ""
    echo "❌ Failed to execute deep link"
fi

echo ""
echo "=========================================="
echo "Additional Commands"
echo "=========================================="
echo ""
echo "Check verification status:"
echo "  adb shell pm get-app-links $PACKAGE_NAME"
echo ""
echo "Re-verify domain:"
echo "  adb shell pm verify-app-links --re-verify $PACKAGE_NAME"
echo ""
echo "Reset app link preferences:"
echo "  adb shell pm set-app-links --package $PACKAGE_NAME 0 all"
echo ""
echo "View logs:"
echo "  adb logcat | grep -i 'app.*link'"
echo ""
echo "Test with different URL (participant):"
echo "  ./scripts/test-deep-link.sh 'https://secret-santa.bombfork.net/?data=DATA&user=Alice'"
echo ""
echo "Test with admin URL:"
echo "  ./scripts/test-deep-link.sh 'https://secret-santa.bombfork.net/?data=DATA&admin=true'"
echo ""
