const router = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const { pool, query } = require('../db');
const config = require('../config');
const requireAdmin = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uniqueSlug, asyncH, getSettings } = require('../utils/helpers');
const { buildTemplates } = require('../utils/templates');

if (config.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts, try again in 15 minutes' } });

const safeEq = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

// ---- Login (single admin from .env) ----
router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const ok = safeEq(username || '', config.adminUsername) & safeEq(password || '', config.adminPassword);
  if (!ok) return res.status(401).json({ error: 'Wrong username or password' });
  const token = jwt.sign({ role: 'admin', u: config.adminUsername }, config.jwtSecret, { expiresIn: '12h' });
  res.json({ token });
});

router.use(requireAdmin);
router.get('/me', (req, res) => res.json({ username: req.admin.u }));

// ---- Dashboard ----
router.get('/stats', asyncH(async (_req, res) => {
  const byStatus = (await query('SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status')).rows;
  const today = (await query(`SELECT COUNT(*)::int AS orders, COALESCE(SUM(total),0)::float AS revenue FROM orders WHERE created_at::date = CURRENT_DATE AND status NOT IN ('cancelled','returned')`)).rows[0];
  const delivered = (await query(`SELECT COALESCE(SUM(total),0)::float AS revenue FROM orders WHERE status='delivered'`)).rows[0];
  const lowStock = (await query('SELECT id, name, stock FROM products WHERE track_stock AND is_active AND stock <= 5 ORDER BY stock LIMIT 10')).rows;
  const counts = (await query('SELECT (SELECT COUNT(*) FROM products)::int AS products, (SELECT COUNT(*) FROM categories)::int AS categories')).rows[0];
  res.json({ byStatus, today, deliveredRevenue: delivered.revenue, lowStock, ...counts });
}));

// ---- Image upload (returns URLs to put in a product / category / review) ----
router.post('/upload', (req, res, next) => {
  upload.array('images', 10)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const files = req.files || [];
      if (!files.length) return res.json({ urls: [] });

      if (config.cloudinary.enabled) {
        const urls = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
          const stream = Readable.from(file.buffer);
          const uploadStream = cloudinary.uploader.upload_stream({
            folder: config.cloudinary.folder,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          }, (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url || result.url);
          });
          stream.pipe(uploadStream);
        })));
        return res.json({ urls });
      }

      return res.json({ urls: files.map((f) => `/uploads/${f.filename}`) });
    } catch (e) {
      next(e);
    }
  });
});

// ================= Categories =================
router.get('/categories', asyncH(async (_req, res) => {
  res.json((await query('SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id)::int AS product_count FROM categories c ORDER BY sort_order, name')).rows);
}));
router.post('/categories', asyncH(async (req, res) => {
  const b = req.body;
  if (!b.name) return res.status(400).json({ error: 'Name is required' });
  const slug = await uniqueSlug('categories', b.slug || b.name, 'cat');
  const r = await query('INSERT INTO categories (name,name_bn,slug,image_url,sort_order,is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [b.name, b.name_bn || null, slug, b.image_url || null, parseInt(b.sort_order) || 0, b.is_active !== false]);
  res.status(201).json(r.rows[0]);
}));
router.put('/categories/:id', asyncH(async (req, res) => {
  const b = req.body, id = parseInt(req.params.id);
  if (!b.name) return res.status(400).json({ error: 'Name is required' });
  const slug = await uniqueSlug('categories', b.slug || b.name, 'cat', id);
  const r = await query('UPDATE categories SET name=$1,name_bn=$2,slug=$3,image_url=$4,sort_order=$5,is_active=$6 WHERE id=$7 RETURNING *',
    [b.name, b.name_bn || null, slug, b.image_url || null, parseInt(b.sort_order) || 0, b.is_active !== false, id]);
  if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
}));
router.delete('/categories/:id', asyncH(async (req, res) => {
  await query('DELETE FROM categories WHERE id=$1', [parseInt(req.params.id)]);
  res.json({ ok: true });
}));

// ================= Products =================
function cleanProduct(b) {
  const arr = (v) => (Array.isArray(v) ? v : []);
  const options = arr(b.options)
    .map((g) => ({
      name: String(g.name || '').trim(),
      name_bn: String(g.name_bn || '').trim(),
      values: arr(g.values).map((v) => ({ label: String(v.label || '').trim(), label_bn: String(v.label_bn || '').trim() })).filter((v) => v.label),
    }))
    .filter((g) => g.name && g.values.length);
  return {
    name: String(b.name || '').trim(),
    name_bn: b.name_bn || null,
    description: b.description || null,
    description_bn: b.description_bn || null,
    category_id: b.category_id ? parseInt(b.category_id) : null,
    price: Number(b.price),
    compare_price: b.compare_price ? Number(b.compare_price) : null,
    stock: parseInt(b.stock) || 0,
    track_stock: b.track_stock !== false,
    images: arr(b.images).filter(Boolean),
    videos: arr(b.videos).map((v) => String(v).trim()).filter(Boolean),
    options,
    is_active: b.is_active !== false,
    is_top: !!b.is_top,
    top_order: parseInt(b.top_order) || 0,
  };
}
const validateProduct = (p) => {
  if (!p.name) return 'Product name is required';
  if (!(p.price >= 0)) return 'Valid price is required';
  if (p.compare_price !== null && p.compare_price < p.price) return 'Compare-at price should be higher than the price';
  return null;
};

router.get('/products', asyncH(async (req, res) => {
  const { q, category, status } = req.query;
  const where = ['TRUE'], params = [];
  if (q) { params.push(`%${q}%`); where.push(`(p.name ILIKE $${params.length} OR p.name_bn ILIKE $${params.length})`); }
  if (category) { params.push(parseInt(category)); where.push(`p.category_id=$${params.length}`); }
  if (status === 'active') where.push('p.is_active'); else if (status === 'hidden') where.push('NOT p.is_active');
  else if (status === 'top') where.push('p.is_top'); else if (status === 'lowstock') where.push('(p.track_stock AND p.stock <= 5)');
  const r = await query(`SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC, p.id DESC`, params);
  res.json(r.rows);
}));
router.get('/products/:id', asyncH(async (req, res) => {
  const r = await query('SELECT * FROM products WHERE id=$1', [parseInt(req.params.id)]);
  if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
}));
router.post('/products', asyncH(async (req, res) => {
  const p = cleanProduct(req.body);
  const err = validateProduct(p);
  if (err) return res.status(400).json({ error: err });
  const slug = await uniqueSlug('products', req.body.slug || p.name, 'p');
  const r = await query(
    `INSERT INTO products (name,name_bn,slug,description,description_bn,category_id,price,compare_price,stock,track_stock,images,videos,options,is_active,is_top,top_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [p.name, p.name_bn, slug, p.description, p.description_bn, p.category_id, p.price, p.compare_price, p.stock, p.track_stock,
      JSON.stringify(p.images), JSON.stringify(p.videos), JSON.stringify(p.options), p.is_active, p.is_top, p.top_order]);
  res.status(201).json(r.rows[0]);
}));
router.put('/products/:id', asyncH(async (req, res) => {
  const id = parseInt(req.params.id);
  const p = cleanProduct(req.body);
  const err = validateProduct(p);
  if (err) return res.status(400).json({ error: err });
  const slug = await uniqueSlug('products', req.body.slug || p.name, 'p', id);
  const r = await query(
    `UPDATE products SET name=$1,name_bn=$2,slug=$3,description=$4,description_bn=$5,category_id=$6,price=$7,compare_price=$8,
       stock=$9,track_stock=$10,images=$11,videos=$12,options=$13,is_active=$14,is_top=$15,top_order=$16,updated_at=NOW()
     WHERE id=$17 RETURNING *`,
    [p.name, p.name_bn, slug, p.description, p.description_bn, p.category_id, p.price, p.compare_price, p.stock, p.track_stock,
      JSON.stringify(p.images), JSON.stringify(p.videos), JSON.stringify(p.options), p.is_active, p.is_top, p.top_order, id]);
  if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
}));
// quick toggles from the product list: { is_active?, is_top?, top_order?, stock? }
router.patch('/products/:id', asyncH(async (req, res) => {
  const allowed = ['is_active', 'is_top', 'top_order', 'stock'];
  const sets = [], vals = [];
  for (const k of allowed) if (k in req.body) { vals.push(req.body[k]); sets.push(`${k}=$${vals.length}`); }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(parseInt(req.params.id));
  const r = await query(`UPDATE products SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${vals.length} RETURNING *`, vals);
  if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
}));
router.delete('/products/:id', asyncH(async (req, res) => {
  await query('DELETE FROM products WHERE id=$1', [parseInt(req.params.id)]);
  res.json({ ok: true });
}));

// ================= Reviews (added by admin) =================
router.get('/reviews', asyncH(async (_req, res) => res.json((await query('SELECT * FROM reviews ORDER BY created_at DESC')).rows)));
router.post('/reviews', asyncH(async (req, res) => {
  const b = req.body;
  if (!b.customer_name) return res.status(400).json({ error: 'Customer name is required' });
  const r = await query('INSERT INTO reviews (customer_name,rating,text,text_bn,photo_url,source,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [b.customer_name, Math.min(5, Math.max(1, parseInt(b.rating) || 5)), b.text || null, b.text_bn || null, b.photo_url || null, b.source || 'WhatsApp', b.is_active !== false]);
  res.status(201).json(r.rows[0]);
}));
router.put('/reviews/:id', asyncH(async (req, res) => {
  const b = req.body;
  const r = await query('UPDATE reviews SET customer_name=$1,rating=$2,text=$3,text_bn=$4,photo_url=$5,source=$6,is_active=$7 WHERE id=$8 RETURNING *',
    [b.customer_name, Math.min(5, Math.max(1, parseInt(b.rating) || 5)), b.text || null, b.text_bn || null, b.photo_url || null, b.source || 'WhatsApp', b.is_active !== false, parseInt(req.params.id)]);
  if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
}));
router.delete('/reviews/:id', asyncH(async (req, res) => {
  await query('DELETE FROM reviews WHERE id=$1', [parseInt(req.params.id)]);
  res.json({ ok: true });
}));

// ================= Orders =================
router.get('/orders', asyncH(async (req, res) => {
  const { status, q, from, to } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const where = ['TRUE'], params = [];
  if (status && STATUSES.includes(status)) { params.push(status); where.push(`o.status=$${params.length}`); }
  if (q) { params.push(`%${q}%`); where.push(`(o.order_number ILIKE $${params.length} OR o.phone ILIKE $${params.length} OR o.customer_name ILIKE $${params.length})`); }
  if (from) { params.push(from); where.push(`o.created_at::date >= $${params.length}`); }
  if (to) { params.push(to); where.push(`o.created_at::date <= $${params.length}`); }
  const total = (await query(`SELECT COUNT(*)::int AS n FROM orders o WHERE ${where.join(' AND ')}`, params)).rows[0].n;
  params.push(limit, (page - 1) * limit);
  const rows = (await query(
    `SELECT o.*, (SELECT COALESCE(SUM(qty),0)::int FROM order_items WHERE order_id=o.id) AS item_count
     FROM orders o WHERE ${where.join(' AND ')} ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params)).rows;
  res.json({ items: rows, total, page, pages: Math.ceil(total / limit) });
}));

// CSV export (same filters as list)
router.get('/orders-export.csv', asyncH(async (req, res) => {
  const { status } = req.query;
  const params = [];
  let w = '';
  if (status && STATUSES.includes(status)) { params.push(status); w = 'WHERE o.status=$1'; }
  const rows = (await query(
    `SELECT o.order_number, o.created_at, o.customer_name, o.phone, o.district, o.address, o.payment_method, o.trx_id,
            o.subtotal, o.discount, o.shipping_fee, o.total, o.status,
            (SELECT string_agg(name || ' x' || qty, '; ') FROM order_items WHERE order_id=o.id) AS items
     FROM orders o ${w} ORDER BY o.created_at DESC`, params)).rows;
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  rows.forEach((r) => { r.created_at = new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 16); });
  const head = Object.keys(rows[0] || { order_number: 1 });
  const csv = '\uFEFF' + [head.join(','), ...rows.map((r) => head.map((h) => esc(r[h])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
  res.send(csv);
}));

async function loadOrder(id) {
  const o = (await query('SELECT * FROM orders WHERE id=$1', [id])).rows[0];
  if (!o) return null;
  o.items = (await query('SELECT * FROM order_items WHERE order_id=$1 ORDER BY id', [id])).rows;
  o.history = (await query('SELECT * FROM order_status_history WHERE order_id=$1 ORDER BY created_at, id', [id])).rows;
  return o;
}

router.get('/orders/:id', asyncH(async (req, res) => {
  const o = await loadOrder(parseInt(req.params.id));
  if (!o) return res.status(404).json({ error: 'Order not found' });
  res.json(o);
}));

// Copy-paste templates. ?trackUrl=https://yoursite.com/track  (frontend passes it)
router.get('/orders/:id/templates', asyncH(async (req, res) => {
  const o = await loadOrder(parseInt(req.params.id));
  if (!o) return res.status(404).json({ error: 'Order not found' });
  res.json(buildTemplates(o, o.items, config.site.name, req.query.trackUrl || ''));
}));

// Update status (+ note shown to customer, courier info, private admin note)
router.patch('/orders/:id/status', asyncH(async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, note, courier_note, admin_note } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cur = (await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [id])).rows[0];
    if (!cur) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Order not found' }); }
    const dead = ['cancelled', 'returned'];
    // give stock back once when an order is cancelled / returned
    if (dead.includes(status) && !dead.includes(cur.status)) {
      await client.query(`UPDATE products p SET stock = p.stock + i.qty FROM order_items i WHERE i.order_id=$1 AND i.product_id=p.id AND p.track_stock`, [id]);
    } else if (!dead.includes(status) && dead.includes(cur.status)) {
      await client.query(`UPDATE products p SET stock = GREATEST(0, p.stock - i.qty) FROM order_items i WHERE i.order_id=$1 AND i.product_id=p.id AND p.track_stock`, [id]);
    }
    await client.query(
      `UPDATE orders SET status=$1, courier_note=COALESCE($2,courier_note), admin_note=COALESCE($3,admin_note), updated_at=NOW() WHERE id=$4`,
      [status, courier_note ?? null, admin_note ?? null, id]);
    if (status !== cur.status || note) {
      await client.query('INSERT INTO order_status_history (order_id,status,note) VALUES ($1,$2,$3)', [id, status, note || null]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  res.json(await loadOrder(id));
}));

router.delete('/orders/:id', asyncH(async (req, res) => {
  await query('DELETE FROM orders WHERE id=$1', [parseInt(req.params.id)]);
  res.json({ ok: true });
}));

// ================= Settings (shipping + discount rules) =================
router.get('/settings', asyncH(async (_req, res) => res.json(await getSettings())));
router.put('/settings', asyncH(async (req, res) => {
  const { shipping, discount_tiers } = req.body;
  if (shipping) await query(`INSERT INTO settings (key,value) VALUES ('shipping',$1) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`, [JSON.stringify({
    insideDhaka: Number(shipping.insideDhaka) || 0, outsideDhaka: Number(shipping.outsideDhaka) || 0,
    freeThreshold: Number(shipping.freeThreshold) || 0, freeWithBkash: !!shipping.freeWithBkash })]);
  if (Array.isArray(discount_tiers)) await query(`INSERT INTO settings (key,value) VALUES ('discount_tiers',$1) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`,
    [JSON.stringify(discount_tiers.map((t) => ({ minQty: parseInt(t.minQty), percent: Number(t.percent) })).filter((t) => t.minQty > 0 && t.percent > 0))]);
  res.json(await getSettings());
}));

module.exports = router;
