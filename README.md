# 🎅 Secret Santa Web Application

A simple, client-side Secret Santa gift exchange organizer. No backend required - all data is encoded in shareable URLs!

## Features

- **Create Secret Santa**: Add participants, set a random seed, and generate assignments
- **Shareable Links**: Each participant gets a unique link showing only their assignment
- **Admin View**: Password-protected view to see all assignments
- **Reproducible**: Same seed always generates the same assignments
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

## Deployment to GitHub Pages

This repository uses GitHub Actions for automated deployment to GitHub Pages.

### Automatic Deployment

Every push to the `main` branch automatically triggers a deployment:

1. Push your changes to the `main` branch
2. GitHub Actions workflow runs automatically
3. Site is deployed to GitHub Pages
4. Access at: `https://bombfork.github.io/open-secret-santa/`

### Manual Deployment

You can also trigger deployment manually:

1. Go to Actions tab in GitHub
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow"

### Initial Setup

If deploying for the first time:

1. Push this repository to GitHub
2. Go to Settings → Pages
3. Set Source to "GitHub Actions"
4. The workflow will deploy on the next push to `main`

**Live URL**: https://bombfork.github.io/open-secret-santa/

## File Structure

```
/
├── .github/
│   └── workflows/
│       └── deploy.yml # GitHub Actions deployment workflow
├── index.html          # Main HTML file
├── styles/
│   └── main.css       # Custom styles
├── js/
│   ├── main.js        # Application entry point & routing
│   ├── create.js      # Create Secret Santa logic
│   ├── view.js        # View assignments logic
│   ├── random.js      # Seeded random generator & assignment algorithm
│   └── encoder.js     # URL encoding/decoding utilities
├── .mise.toml         # mise configuration for development
├── .nojekyll          # GitHub Pages configuration
├── LICENSE            # MIT License
└── README.md          # This file
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

⚠️ **Important**: This application is designed for casual use, not high-security scenarios.

- Passwords are hashed with a simple algorithm (not cryptographically secure)
- Data in URLs can be decoded by anyone with technical knowledge
- URLs appear in browser history and server logs
- Best for friendly gift exchanges, not sensitive data

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires JavaScript enabled
- Uses Clipboard API for copy functionality

## Limitations

- **URL Length**: Very large participant lists may exceed browser URL limits
- **No Exclusions**: Cannot specify people who shouldn't be paired (future enhancement)
- **Browser History**: URLs with data are stored in browser history
- **No Encryption**: Data is encoded, not encrypted

## Future Enhancements

Potential features for future versions:

- [ ] Exclusion rules (people who shouldn't be paired)
- [ ] Email template generator
- [ ] Multi-language support
- [ ] Custom themes
- [ ] Export assignments as PDF
- [ ] URL shortening integration

## License

MIT License - See [LICENSE](LICENSE) file for details

## Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

## Credits

Built with:
- [Pico CSS](https://picocss.com/) - Minimal CSS framework
- Mulberry32 algorithm by Tommy Ettinger
- Fisher-Yates shuffle algorithm
