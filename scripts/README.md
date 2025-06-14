# Clide Handbook Build Scripts

This directory contains scripts to convert the Markdown chapters into beautifully formatted HTML and PDF versions.

## Available Scripts

### 1. build-html-book.js (Full-featured)
Generates a professional HTML book with:
- Syntax highlighting for code blocks
- Interactive table of contents
- Professional typography (IBM Plex Mono for code, Inter for text)
- Dark mode support
- Mobile responsive design
- Print-friendly CSS

**Requirements:**
- Node.js
- npm packages: `marked`, `highlight.js`, `jsdom`

**Usage:**
```bash
# Install dependencies
npm install

# Build HTML book
npm run build

# Serve locally for preview
npm run serve
```

### 2. build-pdf-book.js
Generates a PDF version of the book using Puppeteer.

**Requirements:**
- Node.js
- npm packages: `puppeteer` (installed as dev dependency)

**Usage:**
```bash
# Build PDF (also builds HTML first)
npm run build:pdf
```

### 3. build-simple-html.sh (No dependencies)
A simple bash script that generates HTML without requiring Node.js or npm packages.
- Uses pandoc if available, otherwise basic sed conversion
- Produces a clean, readable HTML file
- Includes embedded CSS

**Usage:**
```bash
# Make executable (if needed)
chmod +x scripts/build-simple-html.sh

# Run the script
./scripts/build-simple-html.sh
```

## Output Files

All build scripts generate files in the `dist/` directory:

- `clide-handbook.html` - Full-featured HTML book
- `clide-handbook.css` - Separate CSS file
- `clide-handbook.pdf` - PDF version
- `clide-handbook-simple.html` - Simple HTML version
- `book-style.css` - CSS for simple version

## Features

### Professional Typography
- **Headings**: Inter font family with proper hierarchy
- **Body text**: Optimized line height and spacing for readability
- **Code**: IBM Plex Mono with syntax highlighting

### Code Highlighting
- GitHub Dark theme for syntax highlighting
- Support for multiple languages (JavaScript, TypeScript, JSON, YAML, etc.)
- Proper formatting for inline and block code

### Responsive Design
- Collapsible sidebar navigation on mobile
- Readable on all device sizes
- Print-optimized styles

### Navigation
- Interactive table of contents
- Smooth scrolling to sections
- Active section highlighting

## Customization

### Modify Colors
Edit the CSS variables in `build-html-book.js`:
```css
:root {
  --color-accent: #0066cc;
  --color-text: #1a1a1a;
  /* ... other colors ... */
}
```

### Change Fonts
Update the font imports and variables:
```css
--font-sans: 'Your Font', sans-serif;
--font-mono: 'Your Mono Font', monospace;
```

### Adjust Layout
Modify the layout variables:
```css
--max-width: 900px;
--sidebar-width: 280px;
```

## Development

To modify the build process:

1. Edit the appropriate script in the `scripts/` directory
2. Test your changes: `npm run build`
3. Preview the output: `npm run serve`

## Troubleshooting

### Missing Dependencies
```bash
npm install
```

### Permission Denied
```bash
chmod +x scripts/*.sh scripts/*.js
```

### PDF Generation Fails
Ensure Puppeteer dependencies are installed:
```bash
npm install puppeteer
```

On Linux, you may need additional system dependencies for Chromium.