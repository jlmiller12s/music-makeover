// Publish only public assets. Server libraries, tests, source documents and
// credentials must never be served as static files by Vercel.
const fs = require('node:fs/promises');
const path = require('node:path');
async function build() {
  const root = path.resolve(__dirname, '..');
  const output = path.join(root, 'public');
  await fs.mkdir(output, { recursive: true });
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html') && (entry.name === 'index.html' || !entry.name.startsWith('index.'))) {
      await fs.copyFile(path.join(root, entry.name), path.join(output, entry.name));
    }
  }
  for (const name of ['assets', 'media']) await fs.cp(path.join(root, name), path.join(output, name), { recursive: true });
  await fs.copyFile(path.join(root, 'logo-v1.png'), path.join(output, 'logo-v1.png'));
  console.log('Public site built; private server files excluded.');
}
build().catch(error => { console.error(error); process.exitCode = 1; });
