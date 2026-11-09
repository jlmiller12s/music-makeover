const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { createDecipheriv } = require('node:crypto');

const products = [
  { file: 'editable.enc', filename: 'The Peace Promise - Editable Workbook.docx', content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { file: 'printable.enc', filename: 'The Peace Promise - Printable.pdf', content_type: 'application/pdf' },
];

async function workbookAttachments(env = process.env) {
  const key = Buffer.from(env.PEACE_WORKBOOK_KEY || '', 'base64');
  if (key.length !== 32) throw new Error('Workbook encryption key is not configured');
  return Promise.all(products.map(async ({ file, filename, content_type }) => {
    const encrypted = await readFile(path.join(__dirname, 'peace-promise-products', file));
    const decipher = createDecipheriv('aes-256-gcm', key, encrypted.subarray(0, 12));
    decipher.setAAD(Buffer.from(filename));
    decipher.setAuthTag(encrypted.subarray(12, 28));
    const content = Buffer.concat([decipher.update(encrypted.subarray(28)), decipher.final()]);
    return { filename, content_type, content: content.toString('base64') };
  }));
}

module.exports = { workbookAttachments, products };
