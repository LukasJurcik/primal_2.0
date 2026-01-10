# Primal 2.0 - Setup Guide

## Prerequisites for Fresh Mac Installation

After reinstalling macOS, you'll need to install the following:

### 1. Install Homebrew (Package Manager)
If you don't have Homebrew installed, run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js and npm
Install Node.js using Homebrew:
```bash
brew install node
```

Or install the latest LTS version using nvm (recommended):
```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal or run:
source ~/.zshrc

# Install latest LTS Node.js
nvm install --lts
nvm use --lts
```

Verify installation:
```bash
node --version
npm --version
```

## Project Setup

1. **Navigate to the project directory:**
   ```bash
   cd /Users/lukas/Desktop/Primal_2.0/primal_2.0
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

   This will install:
   - `terser` - JavaScript minification tool
   - `nodemon` - File watcher for development

## Available Scripts

### Build (Minify main.js)
```bash
npm run build
```
Minifies `main.js` and outputs to `main.min.js` with console.log statements removed.

### Watch Mode (Development)
```bash
npm run watch
```
Watches `main.js` for changes and automatically rebuilds `main.min.js` when you save.

## Project Overview

This project contains JavaScript modules for:
- GSAP animations with ScrollTrigger
- Lenis smooth scrolling
- Barba.js page transitions
- Custom masonry grids
- Custom reel overlays
- Font weight animations

## Dependencies

### External Libraries (loaded via CDN or separately)
- GSAP (GreenSock Animation Platform)
- ScrollTrigger plugin for GSAP
- Lenis (smooth scroll library)
- Barba.js (page transition library)

### Build Tools
- **terser** - Minifies and compresses JavaScript
- **nodemon** - Auto-rebuilds on file changes

## File Structure

```
primal_2.0/
├── main.js                    # Main animation and transition code
├── main.min.js               # Minified version (generated)
├── custom-masonry.js         # Masonry grid functionality
├── custom-reel-overlay.js    # Reel overlay functionality
├── custom-font-weight-animation.js
├── preload-lottie.js
├── values-slider.js
├── values-slider-barba.js
├── package.json              # Node.js dependencies
└── README.md                 # This file
```

## Troubleshooting

### npm install fails
- Make sure Node.js and npm are properly installed
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

### nodemon not found
- Run `npm install` to ensure all dependencies are installed
- If issues persist, install globally: `npm install -g nodemon`

### Build errors
- Check that `main.js` has no syntax errors
- Ensure you're using a compatible Node.js version (14+ recommended)

## Development Workflow

1. Make changes to `main.js` or other source files
2. Run `npm run watch` to auto-rebuild on save
3. Or run `npm run build` manually when ready
4. Use the minified `main.min.js` in production

---

**Note:** This project requires external libraries (GSAP, Lenis, Barba.js) to be loaded separately, typically via CDN links in your HTML files.
