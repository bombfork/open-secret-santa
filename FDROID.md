# F-Droid Submission

How Open Secret Santa gets published on [F-Droid](https://f-droid.org), and what each release must do to keep the listing working.

## Overview

F-Droid builds the app **from source** on its own buildserver and signs the APK with **F-Droid's key** (not ours). Consequences:

- The build recipe lives in the [fdroiddata](https://gitlab.com/fdroid/fdroiddata) repository (one YAML file per app), not here.
- Store listing content (descriptions, changelogs, icon, screenshots) is read from this repo's `fastlane/metadata/android/` tree at the tagged commit.
- App Links verification is per-signing-key: until F-Droid's certificate fingerprint is added to [.well-known/assetlinks.json](.well-known/assetlinks.json), links to secret-santa.bombfork.net open in the browser instead of the app for F-Droid installs. See [Post-inclusion follow-up](#post-inclusion-follow-up).

## Build recipe

Proposed content for `metadata/com.bombfork.opensecretsanta.yml` in an fdroiddata fork:

```yaml
Categories:
  - Messaging
  - Social Network
License: MIT
AuthorName: bombfork
WebSite: https://secret-santa.bombfork.net
SourceCode: https://github.com/bombfork/open-secret-santa
IssueTracker: https://github.com/bombfork/open-secret-santa/issues
Changelog: https://github.com/bombfork/open-secret-santa/releases

AutoName: Open Secret Santa

RepoType: git
Repo: https://github.com/bombfork/open-secret-santa.git

Builds:
  - versionName: 0.2.1
    versionCode: 3
    # full hash of the release tag (git rev-list -n1 v0.2.1) —
    # fdroiddata requires hashes, not tag names
    commit: 155928dc709f4f2113fd2a5449896ebe82aff776
    subdir: android
    sudo:
      - apt-get update
      - apt-get install -y --no-install-recommends curl ca-certificates
      - curl -Lo /tmp/node.tar.gz https://nodejs.org/dist/v20.19.5/node-v20.19.5-linux-x64.tar.gz
      - echo "4eba5fbe1fb10753bc06e42f001a91c5cec16798b7764a3e9257adc59af47fe1  /tmp/node.tar.gz" | sha256sum -c -
      - tar xzf /tmp/node.tar.gz -C /usr/local --strip-components=1
    gradle:
      - yes
    prebuild:
      # single item: fdroidserver joins list entries into one shell, so a cd
      # in one entry leaks into the next
      - cd .. && npm ci --omit=dev && npm run cap:sync

AutoUpdateMode: Version
UpdateCheckMode: Tags ^v[0-9]+\.[0-9]+\.[0-9]+$
CurrentVersion: 0.2.1
CurrentVersionCode: 3
```

Recipe design notes:

- **`sudo` Node install**: the buildserver's Debian ships Node 18; Capacitor 7 requires Node >= 20, so a pinned tarball is installed with checksum verification (same pattern as other Capacitor apps in fdroiddata, e.g. `ca.leradar.app`). When bumping the Node version, take the SHA-256 for `node-vX.Y.Z-linux-x64.tar.gz` from `https://nodejs.org/dist/vX.Y.Z/SHASUMS256.txt`.
- **`prebuild` runs with `subdir` (`android/`) as working directory**, hence the `cd ..` — and it must stay a **single list item**: fdroidserver concatenates the list into one shell invocation, so a `cd` in one entry changes the directory for the entries after it. `npm ci --omit=dev` is deliberate: the dev-dependency chain (`@capacitor/assets` → `@trapezedev/gradle-parse`) ships `.jar` files that would trip F-Droid's binary scanner; the production install contains none, and everything `cap sync` needs (including the Capacitor CLI) is in `dependencies`.
- `npm run cap:sync` recreates the gitignored `www/` from the repo sources and syncs it into `android/app/src/main/assets`. Unlike our release CI it does not copy `.well-known/` into the APK — App Links verification uses the hosted file on the domain, not APK contents.
- The release build is unsigned without `android/keystore.properties` (see [android/app/build.gradle](android/app/build.gradle)), which is exactly what F-Droid wants — they sign the output themselves.

## Submitting (manual steps)

1. Fork [fdroiddata](https://gitlab.com/fdroid/fdroiddata) on gitlab.com and create a branch named `com.bombfork.opensecretsanta`.
2. Add the recipe above as `metadata/com.bombfork.opensecretsanta.yml`. The filename **is** the applicationId — it must match `applicationId` in [android/app/build.gradle](android/app/build.gradle) exactly, or the built APK fails verification.
3. Optional but recommended, from the fdroiddata checkout (needs [fdroidserver](https://f-droid.org/docs/Installing_the_Server_and_Repo_Tools/)):

   ```bash
   fdroid readmeta
   fdroid lint com.bombfork.opensecretsanta
   fdroid build -v -l com.bombfork.opensecretsanta   # full build test, needs Android SDK
   ```

4. Open a merge request against fdroiddata using their [**App inclusion** template](https://gitlab.com/fdroid/fdroiddata/-/blob/master/.gitlab/merge_request_templates/App%20inclusion.md) (the "Choose a template" dropdown in the MR form), titled `New app: Open Secret Santa`. In the description:
   - Link the source repo and the live site.
   - State the native value-add (F-Droid's webview-app policy): fully offline with bundled assets, **no INTERNET permission**, native share and clipboard plugins, Android App Links deep linking.
   - Note zero anti-features: no network access, no tracking, no proprietary dependencies.
5. Respond to reviewer feedback on the MR (Node install idiom and category choice are the most likely discussion points).

## Release discipline

Every release must keep three things in sync (the release workflow enforces the first):

1. **Tag ↔ versionName**: `versionName` in [android/app/build.gradle](android/app/build.gradle) must equal the tag without the `v` prefix. The `Verify tag matches versionName` step in [.github/workflows/android-build.yml](.github/workflows/android-build.yml) fails the release build otherwise.
2. **versionCode**: bump by at least 1 in the same commit; Android and F-Droid compare this value, never versionName.
3. **Changelog**: add `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt` (max 500 characters) for the new versionCode, plus the fr-FR counterpart.

With `AutoUpdateMode: Version` and `UpdateCheckMode: Tags`, F-Droid detects new `vX.Y.Z` tags automatically and adds builds to the recipe on its own — no fdroiddata MR needed after the first inclusion.

## Post-inclusion follow-up

After F-Droid publishes its first build, App Links must be fixed for F-Droid installs:

1. Download the APK from the app's f-droid.org page.
2. Extract F-Droid's signing certificate fingerprint:

   ```bash
   apksigner verify --print-certs open-secret-santa.apk | grep SHA-256
   ```

3. **Append** the fingerprint to the `sha256_cert_fingerprints` array in [.well-known/assetlinks.json](.well-known/assetlinks.json) — keep the existing entry, the array supports multiple keys. Merging to main deploys it via GitHub Pages, and verification starts passing for both signing keys.

Track this in a dedicated issue so it isn't forgotten once the fdroiddata MR merges.
