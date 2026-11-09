// node scripts/package-peace-workbooks.js <editable.docx> <printable.pdf>
// Keeps the key in ignored .env.local; only encrypted products enter the repo.
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, createCipheriv } = require('node:crypto');
const { products } = require('../lib/peacePromiseAttachments');
const root = path.resolve(__dirname, '..');
const inputs = process.argv.slice(2);
if (inputs.length !== 2) throw new Error('Provide the editable DOCX and printable PDF paths');
const originals = inputs.map(file => fs.readFileSync(file));
if (originals[0].subarray(0, 2).toString() !== 'PK' || originals[1].subarray(0, 5).toString() !== '%PDF-') throw new Error('Unexpected workbook file formats');
const envPath = path.join(root, '.env.local');
const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const savedKey = existing.match(/^PEACE_WORKBOOK_KEY=(.+)$/m)?.[1].trim();
const key = savedKey ? Buffer.from(savedKey, 'base64') : randomBytes(32);
if (key.length !== 32) throw new Error('Invalid existing workbook key');
const directory = path.join(root, 'lib', 'peace-promise-products');
fs.mkdirSync(directory, { recursive: true });
if (!savedKey) fs.appendFileSync(envPath, `\nPEACE_WORKBOOK_KEY=${key.toString('base64')}\n`, { mode: 0o600 });
products.forEach(({ file, filename }, index) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(filename));
  const ciphertext = Buffer.concat([cipher.update(originals[index]), cipher.final()]);
  fs.writeFileSync(path.join(directory, file), Buffer.concat([iv, cipher.getAuthTag(), ciphertext]));
});
console.log('Packaged two encrypted workbooks. Key saved only in ignored .env.local.');
