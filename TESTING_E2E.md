# Android End-to-End Testing

Automated E2E tests drive the **real installed APK** with [Maestro](https://docs.maestro.dev/) — on an emulator in CI, and on real devices locally. They exist primarily to catch deep-link regressions (see issue #23 / PR #29: the JS logic was verified via stubs, but the Capacitor/Android delivery layer was never exercised).

## Prerequisites

- **Maestro CLI** (≥ 2.9.0 — earlier versions can't reliably read SPA content in webviews):
  ```bash
  curl -fsSL "https://get.maestro.mobile.dev" | bash
  ```
- **Android SDK** at `~/Android/Sdk` (platform-tools, emulator, a system image) — the project `.mise.toml` exports `ANDROID_HOME` and puts `platform-tools`, `emulator`, and `cmdline-tools` on the PATH, so no manual exports are needed inside the repo
- One connected device or emulator (`adb devices`) — `mise run emulator-start` boots the local `e2e-api34` AVD headless and waits for full boot (`EMULATOR_WINDOW=1` for a visible window; `mise run emulator-stop` / `emulator-list` to manage it)
- Standard project tooling (`mise`, node) — `maestro` and Java 21 are provided by `mise install`

## Running

```bash
mise run e2e                                 # build (if stale), install, run all flows
mise run e2e-flow 01-cold-start-participant  # run a single flow by name
mise run e2e-build                           # just build the debug APK
```

Output (screenshots, Maestro debug output, JUnit report, logcat excerpt on failure) lands in `e2e/output/` (gitignored).

Environment variables:

| Variable | Effect |
|---|---|
| `E2E_SKIP_BUILD=1` | Skip the APK build/staleness check (CI sets this) |
| `E2E_REAL_VERIFICATION=1` | Don't force-approve app links — exercise the real verification chain |
| `ANDROID_SERIAL=...` | Pick a device when several are connected |

## What the tests cover

| Flow | Scenario |
|---|---|
| `01-cold-start-participant` | Link opens app from a dead process — launch intent must reach the router via Capacitor `getLaunchUrl()` (the PR #29 code path). Two variants: fresh install state, and "app was opened before, process killed" (the issue #23 shape) |
| `02-cold-start-admin` | Cold start via admin link → password prompt → unlock → all assignments |
| `03-warm-start` | App alive on landing — link arrives via `onNewIntent` → `appUrlOpen` listener |
| `04-plain-launch` | No link: landing page must show (null launch URL must not break routing) |
| `05-cold-start-dedup` | Duplicate `appUrlOpen` for the launch URL must not re-navigate after "Back to Home" (3000ms dedup window in `js/deeplink.js`) |
| `90-smoke-create` | Create flow through the webview UI (tagged `smoke`; exclude with `maestro test --exclude-tags smoke` if flaky) |

Fixtures are generated at runtime by `e2e/fixtures/generate-fixtures.mjs`, which reuses the production `js/encoder.js` and `js/random.js` — the URLs always match the current data format. A hardcoded `EXPECTED` assignment map makes the generator fail loudly if the assignment algorithm changes; update it deliberately when that happens.

## What the harness can and cannot catch

**The emulator runs (CI and local) force-approve app links** via `pm set-app-links`, because debug builds are signed with a debug cert that is not in `.well-known/assetlinks.json` and can therefore *never* pass real App Links verification.

Catches:
- Cold-start launch-intent delivery through `getLaunchUrl()` against the real APK
- Warm-start `onNewIntent`/`appUrlOpen` delivery under `launchMode="singleTask"`
- Dedup logic, i18n-gating races, all JS routing, webview startup races
- Manifest intent-filter mistakes (a broken filter makes the link land in the browser and assertions fail)

Does **not** catch (by construction):
- Digital Asset Links verification failures: assetlinks.json fingerprint mismatch, GitHub Pages serving issues, signing-cert rotation
- OEM-specific link-handling quirks; links opened from in-app browsers

**A green CI run therefore does not mean "App Links verification works."** To test the real verification chain, run on a real device with a **release-signed** install and `E2E_REAL_VERIFICATION=1`, and use `scripts/test-deep-link.sh` for `pm get-app-links` diagnostics (see DEEP_LINKING.md).

## Real-device testing

This is where issue-#23-class bugs reproduce. Plug in a phone with USB debugging enabled, then `mise run e2e`.

Caveats:
- Debug and release builds share the applicationId — **uninstall the release/Play build first** (`adb uninstall com.bombfork.opensecretasanta`) or the install fails with a signature mismatch.
- Flows assert English UI strings as secondary signals; set the device language to English or expect those assertions to fail (fixture names Alice/Bob are the primary, locale-independent assertions).
- To have a debug build pass *real* verification on your dev phone, append your debug keystore's SHA-256 fingerprint to the `sha256_cert_fingerprints` array in `.well-known/assetlinks.json` (it accepts multiple entries) and redeploy.

## CI

`.github/workflows/android-e2e.yml` runs the flows on every PR and main push that touches app code (path-filtered), plus `workflow_dispatch`. It builds the debug APK, boots an API 34 emulator (`reactivecircus/android-emulator-runner` with KVM + AVD snapshot caching), and runs `e2e/run.sh` with `E2E_SKIP_BUILD=1`. Test output is uploaded as a workflow artifact (`e2e-output-<sha>`), including screenshots and a logcat excerpt on failure. First uncached run takes ~10-15 min; warm runs ~5-7 min.

Maestro is pinned in `.mise.toml` (`github:mobile-dev-inc/maestro`), which both the local harness and CI (`jdx/mise-action`) install from — bump it deliberately, since webview element reading has changed between versions, and re-run the full suite.

## Adding a flow

1. Create `e2e/flows/NN-name.yaml` with the `appId` header and tags (`deeplink`/`regression`/`smoke`).
2. Prefer assertions on fixture names (locale-independent) over UI strings; UI strings must match `locales/en.json` exactly.
3. Select form inputs by HTML id (`tapOn: {id: "participants"}`) — Chromium exposes HTML ids as resource-ids in the accessibility tree.
4. Need new fixture data? Extend `e2e/fixtures/generate-fixtures.mjs` and reference `${NEW_KEY}` in the flow.
5. If Maestro can't see webview content (empty hierarchy in `maestro studio`), add `androidWebViewHierarchy: devtools` to the flow header — it reads the hierarchy via Chrome DevTools, which works in debug builds because Capacitor enables webview debugging.
