# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Open Secret Santa is a client-side Secret Santa gift exchange organizer with no backend. All data is encoded in shareable URLs using Base64 encoding. The application is built with vanilla JavaScript (ES6 modules), Pico CSS, and deployed to GitHub Pages.

## Development Commands

**IMPORTANT**: Always use `mise` tasks for development operations. Do not use direct `npm` or `node` commands unless absolutely necessary.

### Available Mise Tasks

- **`mise run dev`** - Start local development server
- **`mise run test`** - Start server and open application in browser
- **`mise run lint`** - Run ESLint on JavaScript files
- **`mise run format`** - Check code formatting with Prettier
- **`mise run format-fix`** - Fix code formatting with Prettier
- **`mise run validate-i18n`** - Validate i18n JSON files against schema
- **`mise run validate-all`** - Run all validation checks (lint + format + i18n)

### Starting the Development Server

```bash
mise run dev
```

### Testing
```bash
mise run test  # Starts server and opens browser
```

### Code Quality

**Before committing**, ALWAYS run validation tasks:

```bash
# Run all validations (required before commit)
mise run validate-all

# Or run individually:
mise run lint          # Check for code issues
mise run format        # Check formatting
mise run validate-i18n # Validate translations
```

**To auto-fix formatting issues:**
```bash
mise run format-fix
```

## Code Architecture

### Module Structure

The application uses ES6 modules organized by responsibility:

- **main.js**: Application entry point and router. Handles page navigation, initialization, and URL parameter routing. Dispatches to either "create mode" or "view mode" based on URL parameters.

- **create.js**: Create Secret Santa flow. Handles form validation, assignment generation, and URL generation for both admin and participant views.

- **view.js**: View mode for participants and admins. Participant view shows a single assignment. Admin view requires password authentication to reveal all assignments.

- **random.js**: Core assignment algorithm using Mulberry32 PRNG with string hashing (djb2) for reproducible results. Implements Fisher-Yates shuffle with self-assignment prevention.

- **encoder.js**: URL data encoding/decoding with Base64. Contains simple (non-cryptographic) password hashing for admin access.

- **i18n.js**: Internationalization system supporting 18 languages. Handles language detection from localStorage → URL param → browser preference → English fallback.

- **utils.js**: Shared utilities including XSS prevention (escapeHtml) and clipboard copy functionality.

### Routing Logic

The application has two main modes determined by URL parameters:

1. **Create Mode** (no URL params): Landing → Create → Results
2. **View Mode** (has URL params):
   - `?data=...&user=...` → Participant view (shows single assignment)
   - `?data=...&admin=...` → Admin view (requires password)

### Data Flow

1. **Creation**: Participants + Seed → generateAssignments() → encodeData() → Base64 URLs
2. **Viewing**: URL → parseUrlParams() → decodeData() → Display assignment(s)
3. **Reproducibility**: Same participants + same seed = same assignments every time

### Assignment Algorithm

Located in `random.js`:
1. Hash seed string (djb2) → numeric seed
2. Initialize Mulberry32 PRNG with seed
3. Fisher-Yates shuffle participants
4. Rotate to prevent self-assignments if any occur
5. Return {giver, receiver} pairs

### Security Model

This is an **honor system** application, not cryptographically secure:
- Data is Base64 encoded (easily decoded by anyone technical)
- Password hashing is simple, not cryptographic
- URLs contain all data and appear in browser history
- Design assumes trustworthy participants

When working on security features, maintain this casual-use design philosophy. Do not add complex cryptography that might give false sense of security.

### Internationalization

Language switching updates:
1. `setLanguage()` → loads locale JSON
2. Updates localStorage and URL param
3. Dispatches 'languagechange' event
4. `updatePageText()` re-renders all text

When adding translatable text:
- Add key to `locales/en.json` first
- Use nested structure (e.g., `landing.title`)
- Call `t('key.path')` to get translation
- Use `t('key', {placeholder: value})` for replacements

To add a new language:
1. Create `locales/{code}.json` with same structure as en.json
2. Add to `LANGUAGES` object in `js/i18n.js`

### URL Length Constraints

The application has a 50-participant limit due to URL length restrictions (typically 2000-8000 characters depending on browser). Assignments, seed, and all participant names are encoded in the URL.

## Common Development Patterns

### Adding New Form Validation

Add validation logic in `create.js` → `validateInputs()` function. Return `{valid: false, error: t('validation.keyName')}` and add translation key to all locale files.

### Adding New Pages

1. Add page HTML to `index.html` with class `hidden`
2. Add page reference to `pages` object in `main.js`
3. Use `showPage('pageName')` to navigate
4. Add translations in `updatePageText()` function

### Working with Assignments

Assignments are always arrays of `{giver: string, receiver: string}` objects. They're reproducible - same seed always produces same assignments.

## Deployment

GitHub Actions automatically deploys to GitHub Pages on push to main branch. See `.github/workflows/deploy.yml`. The workflow is configured to deploy from root directory (not a subdirectory).

## Testing the Application

Since this is vanilla JS with no build step:
1. Start local server
2. Test create flow manually
3. Test participant URLs (copy link, paste in new tab)
4. Test admin URL with password
5. Test language switching
6. Test with 3 participants (minimum) and ~40-50 participants (URL length limit)
