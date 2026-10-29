const config = require('./config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { query } = require('./db');

const app = express();
app.set('trust proxy', 1);
// CSP is off so YouTube/Vimeo embeds, Google Fonts and the inline theme script work.
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.clientUrls }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(config.uploadDir, { maxAge: '7d' }));

app.get('/api/health', async (_req, res) => {
  try { await query('SELECT 1'); res.json({ ok: true }); }
  catch { res.status(500).json({ ok: false, error: 'Database not reachable' }); }
});
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/public'));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Production: serve the built storefront/admin (client/dist) from this same server.
const dist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist, {
    index: false,
    setHeaders: (res, file) => { if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); },
  }));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/uploads')) return res.status(404).end();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(dist, 'index.html'));
  });
  console.log('Serving website from client/dist');
}
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Something went wrong' : err.message });
});

app.listen(config.port, () => console.log(`MS-MART API running on http://localhost:${config.port}`));
