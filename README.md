# 🎅 Secret Santa Web Application

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

### Using mise (Recommended)

If you have [mise](https://mise.jdx.dev/) installed:

```bash
# Start development server
mise run dev

# Or start server and open in browser
mise run test
```

The server will run on `http://localhost:8000`. Press Ctrl+C to stop.

### Manual Setup

Simply open `index.html` in a web browser, or use a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js (with http-server)
npx http-server -p 8000
```

Then visit `http://localhost:8000`

## File Structure

```
/
├── .github/
│   └── workflows/
│       └── deploy.yml # GitHub Actions deployment workflow
├── locales/
│   ├── en.json        # English translations
│   ├── fr.json        # French translations
│   ├── es.json        # Spanish translations
│   ├── de.json        # German translations
│   ├── ...            # And 14 more languages (18 total)!
├── index.html          # Main HTML file
├── styles/
│   └── main.css       # Custom styles
├── js/
│   ├── main.js        # Application entry point & routing
│   ├── create.js      # Create Secret Santa logic
│   ├── view.js        # View assignments logic
│   ├── random.js      # Seeded random generator & assignment algorithm
│   ├── encoder.js     # URL encoding/decoding utilities
│   └── i18n.js        # Internationalization system
├── .mise.toml         # mise configuration for development
├── .nojekyll          # GitHub Pages configuration
├── LICENSE            # MIT License
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
3. **Self-Assignment Prevention**: Ensures no one is assigned to themselves

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
