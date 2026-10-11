# 🎅 Secret Santa Web Application

[![Android Build](https://github.com/bombfork/open-secret-santa/actions/workflows/android-build.yml/badge.svg)](https://github.com/bombfork/open-secret-santa/actions/workflows/android-build.yml)
[![Lint & Format](https://github.com/bombfork/open-secret-santa/actions/workflows/lint-and-format.yml/badge.svg)](https://github.com/bombfork/open-secret-santa/actions/workflows/lint-and-format.yml)

A simple, client-side Secret Santa gift exchange organizer. No backend required - all data is encoded in shareable URLs!

**🎄 Try it live:** [https://secret-santa.bombfork.net](https://secret-santa.bombfork.net)

## Features

- **Create Secret Santa**: Add participants, set a random seed, and generate assignments
- **Shareable Links**: Each participant gets a unique link showing only their assignment
- **Admin View**: Password-protected view to see all assignments
- **Reproducible**: Same seed always generates the same assignments
- **Multi-Language Support**: Available in 18 languages including 11 practical languages, 4 regional languages, and 3 geek/fantasy languages!
- **Privacy-Focused**: All processing happens in the browser
- **No Backend**: Hosted entirely on GitHub Pages

## How It Works

1. **Create a Secret Santa**: Enter participant names, a random seed, and an admin password
2. **Share Links**: Copy and send each participant their unique link
3. **View Assignments**: Participants click their link to see who they're gifting to
4. **Admin Access**: Use the admin link with the password to view all assignments

## Technology Stack

- **Vanilla JavaScript** (ES6+ modules)
- **Pico CSS** for styling
- **GitHub Pages** for hosting
- **URL-encoded data** (no database needed)

## Local Development

### Prerequisites

- Node.js (latest stable version recommended)
- npm (comes with Node.js)

### Setup

First, install dependencies:

```bash
npm install
```

### Using mise (Recommended)

If you have [mise](https://mise.jdx.dev/) installed:

```bash
# Start development server
mise run dev

# Or start server and open in browser
mise run test

# Run linter
mise run lint

# Check code formatting
mise run format

# Fix code formatting
mise run format-fix

# Validate i18n JSON files
mise run validate-i18n

# Run all validations (lint, format, i18n)
mise run validate-all
```

The server will run on `http://localhost:8000`. Press Ctrl+C to stop.

### Manual Setup

Use npm scripts directly:

```bash
# Start development server
npm run dev

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Check code formatting
npm run format

# Fix code formatting
npm run format:fix

# Validate i18n JSON files
npm run validate:i18n

# Run all validations
npm run validate:all
```

Or use any local server:

```bash
# Node.js (with http-server)
npx http-server -p 8000
```

Then visit `http://localhost:8000`

## Android Development

The project is configured with Capacitor to build native Android applications.

### Prerequisites

- Android Studio (latest stable version)
- Android SDK (API 24 or higher)
- Java 17 or newer (configured via mise in `.mise.toml`)

### Setup

The Android platform has been initialized with:
- **App ID**: `com.bombfork.opensecretasanta`
- **App Name**: `Open Secret Santa`
- **Server Hostname**: `secret-santa.bombfork.net`

### Building for Android

1. **Sync web assets to Android**:
   ```bash
   npm run cap:sync
   ```
   This copies web files to the `www/` directory and syncs them to the Android project.

2. **Open in Android Studio**:
   ```bash
   npm run cap:open:android
   ```
   Or manually:
   ```bash
   npx cap open android
   ```

3. **Run on device/emulator**:
   ```bash
   npm run cap:run:android
   ```
   Or build directly in Android Studio after opening the project.

### Workflow

When making changes to web files (HTML, JS, CSS):
1. Make your changes to files in the root directory
2. Run `npm run cap:sync` to copy changes to the Android project
3. The Android app will reflect the updates

### Deep Linking (App Links)

The Android app supports deep linking via Android App Links. When users click on Secret Santa URLs (`https://secret-santa.bombfork.net/?data=...`), the links automatically open in the app if installed.

**Setup Required:**
1. Update `.well-known/assetlinks.json` with your app signing certificate fingerprints
2. Deploy the file to GitHub Pages (automatic via GitHub Actions)
3. Build and install the app on device

**See detailed documentation:** [DEEP_LINKING.md](DEEP_LINKING.md)

**Test deep links:**
```bash
./scripts/test-deep-link.sh
```

### Automated Builds (CI/CD)

The project uses GitHub Actions to automatically build Android APKs:

- **Debug APKs**: Automatically built on pull requests and pushes to main branch
  - Available as workflow artifacts for testing
  - No signing required

- **Release APKs**: Automatically built on tagged releases (e.g., `v1.0.0`)
  - Signed with release keystore
  - Automatically attached to GitHub Releases
  - Ready for distribution

**To create a release:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

**Setup signing keys:** See [ANDROID_BUILD.md](ANDROID_BUILD.md) for complete instructions on:
- Generating release signing keys
- Configuring GitHub Secrets for automated builds
- Extracting SHA-256 fingerprints for App Links
- Troubleshooting build issues

### Important Notes

- The `www/` directory is gitignored and generated from root files
- Android build artifacts are gitignored (see `.gitignore`)
- The web app runs in a WebView on Android
- All web app functionality works the same on Android as in the browser
- Deep linking allows Secret Santa URLs to open directly in the app

## Offline Operation

The application supports both online (web) and offline (mobile app) operation:

### Web Version (GitHub Pages)
- Loads Pico CSS from CDN for optimal performance
- Requires internet connection for initial load
- Caches static assets after first visit

### Mobile App (Capacitor/Android)
- Includes local copy of Pico CSS (v2.0.6) in `assets/` directory
- Automatically detects Capacitor environment and loads local assets
- Works completely offline after installation
- No external network requests needed

### How It Works
The application uses runtime detection to determine which CSS to load:
- **In browser**: Loads Pico CSS from CDN (`https://cdn.jsdelivr.net/npm/@picocss/pico@2/`)
- **In Capacitor**: Loads local Pico CSS from `assets/pico.min.css`

This ensures:
- Web version benefits from CDN caching and updates
- Mobile app works offline without network dependencies
- Backward compatibility with existing deployments

## File Structure

```
/
├── .github/
│   └── workflows/
│       ├── android-build.yml    # Android APK build workflow
│       ├── deploy.yml           # GitHub Actions deployment workflow
│       └── lint-and-format.yml  # PR validation workflow
├── .well-known/
│   ├── assetlinks.json # Android App Links verification file
│   └── README.md       # Setup instructions for App Links
├── android/                     # Android native project (Capacitor)
│   ├── app/                     # Android application module
│   │   ├── src/main/
│   │   │   ├── java/            # Java source code
│   │   │   ├── assets/          # Web assets (auto-synced)
│   │   │   ├── res/             # Android resources
│   │   │   └── AndroidManifest.xml # Includes App Links intent filter
│   │   └── build.gradle         # App build configuration
│   ├── gradle/                  # Gradle wrapper
│   ├── build.gradle             # Project build configuration
│   └── gradlew                  # Gradle wrapper script
├── assets/
│   ├── pico.min.css             # Local copy of Pico CSS (v2.0.6) for offline use
│   └── PICO_LICENSE             # Pico CSS MIT license
├── locales/
│   ├── schema.json    # JSON schema for i18n validation
│   ├── en.json        # English translations
│   ├── fr.json        # French translations
│   ├── es.json        # Spanish translations
│   ├── de.json        # German translations
│   └── ...            # And 14 more languages (18 total)!
├── scripts/
│   ├── validate-i18n.js # i18n validation script
│   └── test-deep-link.sh # Test Android App Links
├── index.html          # Main HTML file
├── styles/
│   └── main.css       # Custom styles
├── js/
│   ├── main.js        # Application entry point & routing
│   ├── create.js      # Create Secret Santa logic
│   ├── view.js        # View assignments logic
│   ├── random.js      # Seeded random generator & assignment algorithm
│   ├── encoder.js     # URL encoding/decoding utilities
│   ├── i18n.js        # Internationalization system
│   ├── deeplink.js    # Android App Links deep linking handler
│   └── utils.js       # Shared utilities
├── www/                # Web assets for Capacitor (auto-generated, gitignored)
├── capacitor.config.json # Capacitor configuration (includes androidScheme)
├── .mise.toml         # mise configuration for development
├── package.json       # Node.js dependencies and scripts
├── .nojekyll          # GitHub Pages configuration
├── LICENSE            # MIT License
├── ANDROID_BUILD.md   # Android signing and CI/CD setup documentation
├── DEEP_LINKING.md    # Android App Links documentation
└── README.md          # This file
```

## Internationalization (i18n)

The application supports multiple languages with automatic detection and persistence.

### Supported Languages

**18 languages total!**

**Practical Languages:**
- 🇬🇧 **English** (default)
- 🇫🇷 **French** (Français)
- 🇪🇸 **Spanish** (Español)
- 🇩🇪 **German** (Deutsch)
- 🇮🇹 **Italian** (Italiano)
- 🇵🇹 **Portuguese** (Português)
- 🇳🇱 **Dutch** (Nederlands)
- 🇵🇱 **Polish** (Polski)
- 🇷🇺 **Russian** (Русский)
- 🇯🇵 **Japanese** (日本語)
- 🇨🇳 **Chinese** (中文)

**Regional Languages:**
- 🏴 **Catalan** (Català)
- 🏴 **Basque** (Euskara)
- 🏴 **Galician** (Galego)
- 🏴 **Occitan** (Occitan)

**Geek/Fantasy Languages:**
- 🖖 **Klingon** (tlhIngan Hol) - Qapla'!
- 🧝 **Sindarin** (Elvish/LOTR) - Mae govannen!
- ✨ **Quenya** (High Elvish/LOTR) - Aiya!

### Language Detection

The application determines language in this priority order:

1. User's explicit choice (saved in localStorage)
2. URL parameter (`?lang=fr`)
3. Browser language preference
4. Falls back to English

### Adding New Languages

To add a new language:

1. Create a new translation file in `locales/` (e.g., `it.json` for Italian)
2. Copy the structure from `locales/en.json`
3. Translate all text values
4. Add the language to `LANGUAGES` object in `js/i18n.js`:

```javascript
export const LANGUAGES = {
    en: { name: 'English', flag: '🇬🇧' },
    fr: { name: 'Français', flag: '🇫🇷' },
    es: { name: 'Español', flag: '🇪🇸' },
    de: { name: 'Deutsch', flag: '🇩🇪' },
    it: { name: 'Italiano', flag: '🇮🇹' }  // New language
};
```

### Translation File Structure

Each translation file contains nested objects with keys for different sections:

```json
{
  "landing": {
    "title": "Secret Santa",
    "subtitle": "Organize your gift exchange with ease",
    ...
  },
  "create": { ... },
  "results": { ... },
  "viewParticipant": { ... },
  "viewAdmin": { ... },
  "error": { ... },
  "validation": { ... },
  "alerts": { ... }
}
```

## How the Algorithm Works

### Random Assignment

1. **Seeded Random Generator**: Uses Mulberry32 algorithm with string hashing for reproducible randomness
2. **Fisher-Yates Shuffle**: Fairly shuffles the participants list
3. **Minimum List Distance**: People entered close together in the list (couples, families) never draw each other — the required distance grows with group size (adjacent entries are excluded from 5 participants up, to a maximum distance of 5 for groups of 20+). Shuffles are redrawn until one satisfies the rule; self-assignment is excluded for every group size

### Data Encoding

- Assignments are stored as JSON
- Encoded with Base64 for URL-safe transmission
- Admin password is hashed (simple hash, not cryptographically secure)
- All data travels in URL parameters

### URL Structure

**Participant Link:**
```
https://example.com/?data=<encoded_data>&user=<participant_name>
```

**Admin Link:**
```
https://example.com/?data=<encoded_data>&admin=<password_hash>
```

## Security Considerations

🎄 **Made for Fair Players**: This app works on the honor system!

This Secret Santa application is designed for **casual, friendly exchanges** with trustworthy groups (family, friends, coworkers). Here's what you should know:

- **Encoded, not encrypted**: Links use Base64 encoding - anyone with technical knowledge can decode them
- **Honor system**: We assume participants play fair and don't peek at others' assignments
- **Simple password hashing**: Admin passwords use basic hashing (not cryptographically secure)
- **URLs in history**: Assignment links appear in browser history and server logs
- **Perfect for**: Friendly groups where everyone plays by the rules
- **Not recommended for**: High-security scenarios or groups with untrusted participants

If you need Fort Knox security, this might not be your app! 😊 But for most casual Secret Santa exchanges, it works great.

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires JavaScript enabled
- Uses Clipboard API for copy functionality

## Limitations

- **Participant Limit**: Maximum 50 participants (due to URL length constraints)
- **No Exclusions**: Cannot specify people who shouldn't be paired (future enhancement)
- **Browser History**: URLs with data are stored in browser history
- **No Encryption**: Data is encoded, not encrypted

## License

MIT License - See [LICENSE](LICENSE) file for details

## Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

## Credits

Built with:
- [Pico CSS](https://picocss.com/) - Minimal CSS framework
- Mulberry32 algorithm by Tommy Ettinger
- Fisher-Yates shuffle algorithm
