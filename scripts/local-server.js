const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const crmHandler = require('../api/crm');
const authHandler = require('../api/auth');
const inquiriesHandler = require('../api/inquiries');
const testimonialsHandler = require('../api/testimonials');
const portalPreviewHandler = require('../api/portal-preview');
const publicConfigHandler = require('../api/public-config');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

    if (pathname === '/api/crm') return crmHandler(req, res);
    if (pathname === '/api/auth') return authHandler(req, res);
    if (pathname === '/api/inquiries') return inquiriesHandler(req, res);
    if (pathname === '/api/testimonials') return testimonialsHandler(req, res);
    if (pathname === '/api/portal-preview') return portalPreviewHandler(req, res);
    if (pathname === '/api/public-config') return publicConfigHandler(req, res);

    const filePath = resolveStaticPath(pathname);
    const data = await fs.readFile(filePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
    res.end(data);
  } catch (error) {
    res.statusCode = error.code === 'ENOENT' ? 404 : 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(res.statusCode === 404 ? 'Not found' : 'Server error');
  }
});

server.listen(port, () => {
  console.log(`Music Makeover local server running at http://localhost:${port}`);
});

function resolveStaticPath(pathname) {
  let clean = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (!clean) clean = 'index.html';
  if (!path.extname(clean)) clean = `${clean}.html`;

  const resolved = path.resolve(root, clean);
  if (!resolved.startsWith(root)) {
    const error = new Error('Invalid path');
    error.code = 'ENOENT';
    throw error;
  }
  return resolved;
}
