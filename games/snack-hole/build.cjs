const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const root = __dirname;
const destination = path.join(root, 'dist');
fs.mkdirSync(destination, { recursive: true });
esbuild.buildSync({
  absWorkingDir: root,
  entryPoints: ['logic.js', 'art.js', 'game.js'],
  outdir: destination,
  target: ['safari12'],
  minify: true,
  charset: 'utf8',
  legalComments: 'none',
  logLevel: 'warning',
});
for (const name of ['index.html', 'style.css', 'icon.svg', 'fredoka-500.woff2', 'fredoka-700.woff2', 'FONT-LICENSE.txt']) {
  fs.copyFileSync(path.join(root, name), path.join(destination, name));
}
let bytes = 0;
for (const name of fs.readdirSync(destination)) bytes += fs.statSync(path.join(destination, name)).size;
console.log(`Built ${fs.readdirSync(destination).length} self-contained files, ${(bytes / 1024).toFixed(1)} KiB total. JavaScript target: Safari 12.`);
