#!/usr/bin/env bash
# Android e2e test runner (Maestro).
#
# Usage:
#   bash e2e/run.sh                      # run all flows
#   bash e2e/run.sh 01-cold-start-participant   # run a single flow by name
#
# Environment:
#   E2E_SKIP_BUILD=1         skip APK build/staleness check (CI sets this)
#   E2E_REAL_VERIFICATION=1  do NOT force-approve app links — exercise the
#                            real Digital Asset Links verification chain
#                            (expect failures with debug builds, whose cert
#                            is not in .well-known/assetlinks.json)
#   ANDROID_SERIAL=...       target a specific adb device
set -euo pipefail

cd "$(dirname "$0")/.."

APP_ID="com.bombfork.opensecretasanta"
APP_HOST="secret-santa.bombfork.net"
APK="android/app/build/outputs/apk/debug/app-debug.apk"
OUTPUT_DIR="e2e/output"

mkdir -p "$OUTPUT_DIR"

# --- Preflight ---------------------------------------------------------------

if ! command -v maestro >/dev/null 2>&1; then
  echo "maestro not found. Install it with:" >&2
  echo '  curl -fsSL "https://get.maestro.mobile.dev" | bash' >&2
  exit 1
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install Android platform-tools." >&2
  exit 1
fi

DEVICES=$(adb devices | awk 'NR>1 && $2=="device" {print $1}')
DEVICE_COUNT=$(echo "$DEVICES" | grep -c . || true)
if [ "$DEVICE_COUNT" -eq 0 ]; then
  echo "No adb device/emulator connected." >&2
  exit 1
fi
if [ "$DEVICE_COUNT" -gt 1 ] && [ -z "${ANDROID_SERIAL:-}" ]; then
  echo "Multiple adb devices connected; set ANDROID_SERIAL to pick one:" >&2
  echo "$DEVICES" >&2
  exit 1
fi

# --- Build (if stale) --------------------------------------------------------

if [ "${E2E_SKIP_BUILD:-0}" != "1" ]; then
  STALE=0
  if [ ! -f "$APK" ]; then
    STALE=1
  elif [ -n "$(find js index.html locales android/app/src capacitor.config.json -newer "$APK" -print -quit 2>/dev/null)" ]; then
    STALE=1
  fi
  if [ "$STALE" -eq 1 ]; then
    echo "APK missing or stale — building..."
    mise run e2e-build
  else
    echo "APK up to date: $APK"
  fi
fi

if [ ! -f "$APK" ]; then
  echo "APK not found at $APK — build it with: mise run e2e-build" >&2
  exit 1
fi

# --- Install -----------------------------------------------------------------

echo "Installing $APK..."
if ! INSTALL_OUT=$(adb install -r "$APK" 2>&1); then
  echo "$INSTALL_OUT" >&2
  if echo "$INSTALL_OUT" | grep -q "INSTALL_FAILED_UPDATE_INCOMPATIBLE"; then
    echo >&2
    echo "Debug and release builds share the applicationId. Uninstall the" >&2
    echo "release/Play build first:  adb uninstall $APP_ID" >&2
  fi
  exit 1
fi

# --- App Links approval ------------------------------------------------------
# Debug builds can never pass real App Links verification (their signing cert
# is not in assetlinks.json), so force-approve the domain. API 31+ only;
# failures are tolerated — the flows' `openLink autoVerify: true` handles the
# disambiguation sheet as a second layer.

if [ "${E2E_REAL_VERIFICATION:-0}" != "1" ]; then
  echo "Force-approving app links for $APP_HOST (skip with E2E_REAL_VERIFICATION=1)..."
  adb shell pm set-app-links --package "$APP_ID" 2 all || true
  adb shell pm set-app-links-user-selection --user 0 --package "$APP_ID" true "$APP_HOST" || true
else
  echo "E2E_REAL_VERIFICATION=1 — leaving app-links verification untouched."
  adb shell pm get-app-links "$APP_ID" || true
fi

# --- Fixtures ----------------------------------------------------------------

FIXTURES=$(node e2e/fixtures/generate-fixtures.mjs)
ENV_ARGS=()
while IFS='=' read -r key value; do
  ENV_ARGS+=(-e "$key=$value")
done < <(echo "$FIXTURES" | jq -r 'to_entries[] | "\(.key)=\(.value)"')

# --- Run ---------------------------------------------------------------------

TARGET="e2e"
if [ $# -ge 1 ]; then
  TARGET="e2e/flows/$1.yaml"
  if [ ! -f "$TARGET" ]; then
    echo "Flow not found: $TARGET" >&2
    exit 1
  fi
fi

adb logcat -c || true

set +e
maestro test "$TARGET" \
  "${ENV_ARGS[@]}" \
  --debug-output "$OUTPUT_DIR" \
  --format junit --output "$OUTPUT_DIR/report.xml"
STATUS=$?
set -e

# --- Collect screenshots -----------------------------------------------------
# Maestro writes screenshots and per-flow debug data under a hidden .maestro
# directory; rename it so CI artifact upload (which skips hidden files) and
# humans can see it. Also sweep any stray PNGs into OUTPUT_DIR.

if [ -d "$OUTPUT_DIR/.maestro" ]; then
  rm -rf "$OUTPUT_DIR/maestro-debug"
  mv "$OUTPUT_DIR/.maestro" "$OUTPUT_DIR/maestro-debug"
fi
find e2e/flows -name "*.png" -exec mv -f {} "$OUTPUT_DIR/" \; 2>/dev/null || true
find . -maxdepth 1 -name "*.png" -exec mv -f {} "$OUTPUT_DIR/" \; 2>/dev/null || true

# --- Diagnostics on failure --------------------------------------------------

if [ "$STATUS" -ne 0 ]; then
  adb logcat -d >"$OUTPUT_DIR/logcat-full.txt" 2>/dev/null || true
  echo
  echo "=== Deep-link related logcat excerpt (full log: $OUTPUT_DIR/logcat-full.txt) ==="
  grep -iE "appUrlOpen|launch url|deep link|Capacitor/Console" "$OUTPUT_DIR/logcat-full.txt" 2>/dev/null \
    | tail -50 \
    | tee "$OUTPUT_DIR/logcat-excerpt.txt" \
    || true
fi

exit "$STATUS"
