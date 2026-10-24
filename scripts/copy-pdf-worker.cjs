const fs = require('fs');
const path = require('path');

const root = process.cwd();
const candidates = [
  'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  'node_modules/pdfjs-dist/build/pdf.worker.mjs',
  'node_modules/pdfjs-dist/build/pdf.worker.min.js',
  'node_modules/pdfjs-dist/build/pdf.worker.js'
].map((item) => path.join(root, item));

const source = candidates.find((item) => fs.existsSync(item));

// Some desktop builds do not install pdfjs-dist directly. Do not break npm install
// when PDF support is absent; Vite/build can then report the actual missing dependency.
if (!source) {
  console.warn('[copy-pdf-worker] pdfjs worker not found; skipping copy.');
  process.exit(0);
}

const publicDir = path.join(root, 'public');
fs.mkdirSync(publicDir, { recursive: true });

const extension = path.extname(source);
const destination = path.join(publicDir, `pdf.worker.min${extension}`);
fs.copyFileSync(source, destination);
console.log(`[copy-pdf-worker] copied ${path.relative(root, source)} -> ${path.relative(root, destination)}`);
