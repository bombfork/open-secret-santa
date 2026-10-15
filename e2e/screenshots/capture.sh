#!/usr/bin/env bash
# Captures the store-listing screenshots into fastlane/metadata/android/
# en-US/images/phoneScreenshots/. Needs a booted emulator/device and a debug
# APK (mise run emulator-start; mise run e2e-build).
set -euo pipefail

cd "$(dirname "$0")/../.."

APP_ID="com.bombfork.opensecretasanta"
APP_HOST="secret-santa.bombfork.net"
APK="android/app/build/outputs/apk/debug/app-debug.apk"
DEST="fastlane/metadata/android/en-US/images/phoneScreenshots"

[ -f "$APK" ] || { echo "APK not found — run: mise run e2e-build" >&2; exit 1; }

adb install -r "$APK"

# Debug cert is not in assetlinks.json — force-approve links like e2e/run.sh
adb shell pm set-app-links --package "$APP_ID" 2 all || true
adb shell pm set-app-links-user-selection --user 0 --package "$APP_ID" true "$APP_HOST" || true

adb shell input keyevent KEYCODE_WAKEUP || true
adb shell wm dismiss-keyguard || true

FIXTURES=$(node e2e/fixtures/generate-fixtures.mjs)
ENV_ARGS=()
while IFS='=' read -r key value; do
  ENV_ARGS+=(-e "$key=$value")
done < <(echo "$FIXTURES" | jq -r 'to_entries[] | "\(.key)=\(.value)"')

# Maestro writes takeScreenshot files under <debug-output>/<flow>/takeScreenshot/
DEBUG_OUT="e2e/output/screenshots"
rm -rf "$DEBUG_OUT"
mkdir -p "$DEBUG_OUT"

maestro test "${ENV_ARGS[@]}" --debug-output "$DEBUG_OUT" e2e/screenshots/capture.yaml

mkdir -p "$DEST"
for n in 1 2 3; do
  src=$(find "$DEBUG_OUT" -name "$n.png" -print -quit)
  [ -n "$src" ] || { echo "Screenshot $n.png not found under $DEBUG_OUT" >&2; exit 1; }
  cp "$src" "$DEST/$n.png"
done
echo "Screenshots copied to $DEST"
