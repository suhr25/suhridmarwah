import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';

// Publish an explicit allowlist so source files and local configuration stay private.
await mkdir('dist/vendor', { recursive: true });
const assets = ['style.css', 'script.js', 'background.js', 'scroll-motion.js', 'devcard.js', 'vendor/three.min.js', 'vendor/THREE-LICENSE.txt'];
for (const asset of assets) await copyFile(asset, `dist/${asset}`);
let html = await readFile('index.html', 'utf8');
for (const asset of assets) html = html.replaceAll(`"${asset}"`, `"/${asset}"`);
await writeFile('dist/index.html', html);
console.log(`Prepared dist/index.html and ${assets.length} static assets.`);
