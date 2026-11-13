# Suhrid Marwah Portfolio

A responsive portfolio using HTML, CSS, JavaScript, and a locally bundled Three.js background. No build step is required.

For Cloudflare Pages deployment settings, run `node build.mjs` and see [DEPLOYMENT.md](DEPLOYMENT.md).

Open `index.html` directly in your browser, or serve this directory with `npx --yes serve . -l 3000` and visit `http://localhost:3000`.

Deploy `index.html`, `style.css`, `script.js`, `scroll-motion.js`, `background.js`, and the complete `vendor/` directory together.

## Files

- `index.html`: biography, experience, projects, skills, and contact links.
- `style.css`: responsive layouts, navigation transitions, and section reveals.
- `script.js`: mobile navigation, active section tracking, project parallax, and scroll reveals.
- `scroll-motion.js`: coordinated section entrances, masked headings, hero exit, and project depth.
- `background.js`: GPU-animated particle landscape, scroll-linked camera, and motion lifecycle.
- `vendor/three.min.js`: Three.js 0.160.0, distributed under the accompanying MIT license.

The scene caps rendering at 30 frames per second and lowers geometry density and pixel resolution on mobile. It pauses in hidden tabs, respects reduced-motion preferences, and falls back to a static gradient if WebGL is unavailable. Navigation and content work independently of Three.js. Google Fonts is optional and has system-font fallbacks.

Evenly is linked as an external portfolio project. Its application and repository are separate from this codebase.
