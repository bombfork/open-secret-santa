# F-Droid Submission

How Open Secret Santa gets published on [F-Droid](https://f-droid.org), and what each release must do to keep the listing working.

## Overview

The app uses F-Droid's **reproducible builds** flow: F-Droid rebuilds each release from source on its buildserver, verifies the rebuild is byte-identical to our published APK (`apksigcopier`), and then distributes **our developer-signed APK** — F-Droid never signs it with their own key. Consequences:

- The build recipe lives in the [fdroiddata](https://gitlab.com/fdroid/fdroiddata) repository (one YAML file per app), not here.
- Store listing content (descriptions, changelogs, icon, screenshots) is read from this repo's `fastlane/metadata/android/` tree at the tagged commit.
- App Links to secret-santa.bombfork.net work out of the box on F-Droid installs: the published APK carries the same signature already listed in [.well-known/assetlinks.json](.well-known/assetlinks.json), and GitHub-release and F-Droid installs can update over each other.
- The flip side: a release whose rebuild does not match byte-for-byte is **silently skipped** by F-Droid. The release workflow therefore verifies reproducibility (clean rebuild + `apksigcopier compare`) before publishing, and fails the release loudly instead.

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

# Reproducible builds: F-Droid downloads this APK, rebuilds from source,
# verifies byte-identity, and publishes the developer-signed binary
Binaries: https://github.com/bombfork/open-secret-santa/releases/download/v%v/open-secret-santa-%v.apk

AllowedAPKSigningKeys: bf2338049f8f0ba8085ac82ba9b8adf72dc87cecdbf10e0eeb938b1a271f7b8c

Builds:
  - versionName: 0.2.4
    versionCode: 6
    # full hash of the release tag (git rev-list -n1 v0.2.4) —
    # fdroiddata requires hashes, not tag names
    commit: <FULL_COMMIT_HASH_OF_v0.2.4>
    subdir: android/app
    sudo:
      - apt-get update
      - apt-get install -y --no-install-recommends nodejs npm
    gradle:
      - yes
    output: build/outputs/apk/release/app-release-unsigned.apk
    prebuild:
      # single item: fdroidserver joins list entries into one shell, so a cd
      # in one entry leaks into the next
      - cd ../.. && npm ci --omit=dev && npm run cap:sync
    scandelete:
      - node_modules

AutoUpdateMode: Version
UpdateCheckMode: Tags ^v[0-9]+\.[0-9]+\.[0-9]+$
CurrentVersion: 0.2.4
CurrentVersionCode: 6
```

Recipe design notes:

- **`sudo` Node install from Debian**: the buildserver runs Debian trixie+, whose `nodejs` (20.19) satisfies Capacitor 7's `>=20` engine requirement — plain `apt-get install nodejs npm`, no pinned tarball (reviewer-requested on the inclusion MR).
- **`subdir` points at the app module (`android/app`), not the gradle root**: fdroidserver only finds the built APK via the `output` path relative to `subdir` ("Failed to find any output apks" otherwise), and `output` must name the module's own build dir. Same shape as `ca.leradar.app`. `prebuild` runs with `subdir` as working directory, hence the `cd ../..` — and it must stay a **single list item**: fdroidserver concatenates the list into one shell invocation, so a `cd` in one entry changes the directory for the entries after it. `npm ci --omit=dev` is deliberate: the dev-dependency chain (`@capacitor/assets` → `@trapezedev/gradle-parse`) ships `.jar` files that would trip F-Droid's binary scanner; the production install contains none, and everything `cap sync` needs (including the Capacitor CLI) is in `dependencies`.
- `npm run cap:sync` recreates the gitignored `www/` from the repo sources and syncs it into `android/app/src/main/assets`. Unlike our release CI it does not copy `.well-known/` into the APK — App Links verification uses the hosted file on the domain, not APK contents.
- **`scandelete: node_modules`** (same as `ca.leradar.app`): the scanner flags the template tarballs shipped in `node_modules/@capacitor/cli/assets/` even on a prod-only install. `scandelete` removes only the *flagged* files under the listed path, after prebuild has already consumed them (`cap sync` runs in prebuild), so the `@capacitor/android` sources gradle builds from stay intact.
- The release build is unsigned without `android/keystore.properties` (see [android/app/build.gradle](android/app/build.gradle)) — F-Droid's rebuild stays unsigned and gets our signature copied onto it (`apksigcopier`) after byte-identity is verified.
- **`dependenciesInfo` is disabled** in [android/app/build.gradle](android/app/build.gradle): AGP otherwise embeds a Google-encrypted dependency list in the APK Signing Block, and F-Droid rejects binaries carrying that block (`found extra signing block 'Dependency metadata'`).
- **`Binaries` + `AllowedAPKSigningKeys`** enable the reproducible flow. `AllowedAPKSigningKeys` is our release cert's SHA-256 (the same fingerprint as in `.well-known/assetlinks.json`, lowercase, colons stripped). Reproducibility was validated empirically: two clean-clone builds are byte-identical (R8 included), output is identical across zulu-21 and openjdk-21, and AGP-signed APKs pass `apksigcopier compare`.

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

Every release must keep four things in sync (the release workflow enforces 1 and 4):

1. **Tag ↔ versionName**: `versionName` in [android/app/build.gradle](android/app/build.gradle) must equal the tag without the `v` prefix. The `Verify tag matches versionName` step in [.github/workflows/android-build.yml](.github/workflows/android-build.yml) fails the release build otherwise.
2. **versionCode**: bump by at least 1 in the same commit; Android and F-Droid compare this value, never versionName.
3. **Changelog**: add `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt` (max 500 characters) for the new versionCode, plus the fr-FR counterpart.
4. **Reproducibility**: the `Verify release is reproducible` step rebuilds unsigned from a clean tree and runs `apksigcopier compare` against the signed APK; a mismatch fails the release (F-Droid would otherwise skip the version silently). Keep the release job's web-asset steps identical to the recipe's prebuild (`npm ci --omit=dev && npm run cap:sync`) and don't add build inputs that F-Droid's rebuild won't have.

With `AutoUpdateMode: Version` and `UpdateCheckMode: Tags`, F-Droid detects new `vX.Y.Z` tags automatically and adds builds to the recipe on its own — no fdroiddata MR needed after the first inclusion. Each new build is verified against the matching GitHub-release APK via `Binaries` before being published.
