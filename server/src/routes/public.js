const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { pool, query } = require('../db');
const config = require('../config');
const { orderNumber, normPhone, asyncH, getSettings } = require('../utils/helpers');

const trackLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts, try again later' } });
const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many orders, try again later' } });

const PRODUCT_COLS = `p.id, p.name, p.name_bn, p.slug, p.description, p.description_bn, p.price, p.compare_price,
  p.stock, p.track_stock, p.images, p.videos, p.options, p.is_top, p.created_at,
  c.id AS category_id, c.name AS category_name, c.name_bn AS category_name_bn, c.slug AS category_slug`;

// ---- Site config + shipping/discount rules (frontend uses this) ----
router.get('/config', asyncH(async (_req, res) => {
  const s = await getSettings();
  res.json({ site: config.site, shipping: s.shipping, discountTiers: s.discount_tiers });
}));

// ---- Categories ----
router.get('/categories', asyncH(async (_req, res) => {
  const r = await query(
    `SELECT c.id, c.name, c.name_bn, c.slug, c.image_url,
            (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id AND p.is_active)::int AS product_count
     FROM categories c WHERE c.is_active ORDER BY c.sort_order, c.name`);
  res.json(r.rows);
}));

// ---- Products list: ?q=&category=slug&min=&max=&sort=&inStock=1&page=&limit= ----
router.get('/products', asyncH(async (req, res) => {
  const { q, category, min, max, sort = 'newest', inStock } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(req.query.limit) || 12));
  const where = ['p.is_active'], params = [];
  const add = (sql, v) => { params.push(v); where.push(sql.replace('?', `$${params.length}`)); };
  if (q) {
    params.push(`%${q}%`);
    const n = params.length;
    where.push(`(p.name ILIKE $${n} OR p.name_bn ILIKE $${n} OR p.description ILIKE $${n})`);
  }
  if (category) add('c.slug = ?', category);
  if (min) add('p.price >= ?', Number(min));
  if (max) add('p.price <= ?', Number(max));
  if (inStock === '1') where.push('(NOT p.track_stock OR p.stock > 0)');
  const sorts = {
    newest: 'p.created_at DESC', price_asc: 'p.price ASC', price_desc: 'p.price DESC',
    name_asc: 'p.name ASC', name_desc: 'p.name DESC',
  };
  const order = sorts[sort] || sorts.newest;
  const from = `FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE ${where.join(' AND ')}`;
  const total = (await query(`SELECT COUNT(*)::int AS n ${from}`, params)).rows[0].n;
  params.push(limit, (page - 1) * limit);
  const items = (await query(`SELECT ${PRODUCT_COLS} ${from} ORDER BY ${order}, p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params)).rows;
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

// ---- Top products (admin chooses) ----
router.get('/products/top', asyncH(async (_req, res) => {
  const r = await query(
    `SELECT ${PRODUCT_COLS} FROM products p LEFT JOIN categories c ON c.id=p.category_id
     WHERE p.is_active AND p.is_top ORDER BY p.top_order, p.id DESC LIMIT 20`);
  res.json(r.rows);
}));

// ---- Single product + related ----
router.get('/products/:slug', asyncH(async (req, res) => {
  const r = await query(
    `SELECT ${PRODUCT_COLS} FROM products p LEFT JOIN categories c ON c.id=p.category_id
     WHERE p.is_active AND p.slug=$1`, [req.params.slug]);
  if (!r.rowCount) return res.status(404).json({ error: 'Product not found' });
  const p = r.rows[0];
  const rel = await query(
    `SELECT ${PRODUCT_COLS} FROM products p LEFT JOIN categories c ON c.id=p.category_id
     WHERE p.is_active AND p.id<>$1 AND ($2::int IS NULL OR p.category_id=$2)
     ORDER BY RANDOM() LIMIT 8`, [p.id, p.category_id]);
  res.json({ product: p, related: rel.rows });
}));

// ---- Reviews (admin-added) ----
router.get('/reviews', asyncH(async (_req, res) => {
  const r = await query('SELECT id, customer_name, rating, text, text_bn, photo_url, source, created_at FROM reviews WHERE is_active ORDER BY created_at DESC LIMIT 30');
  res.json(r.rows);
}));

// ---- Place order (prices are ALWAYS recalculated from the database) ----
router.post('/orders', orderLimiter, asyncH(async (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const phone = String(b.phone || '').trim();
  const district = String(b.district || '').trim();
  const address = String(b.address || '').trim();
  const payment = b.paymentMethod === 'bkash' ? 'bkash' : 'cod';
  const items = Array.isArray(b.items) ? b.items : [];

  if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name' });
  if (normPhone(phone).length < 10 || !/^[+\d\s-]{10,16}$/.test(phone)) return res.status(400).json({ error: 'Please enter a valid phone number' });
  if (!district) return res.status(400).json({ error: 'Please select your district' });
  if (address.length < 8) return res.status(400).json({ error: 'Please enter your full address' });
  if (!items.length || items.length > 50) return res.status(400).json({ error: 'Your cart is empty' });
  if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) return res.status(400).json({ error: 'Invalid email address' });

  const settings = await getSettings();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ids = [...new Set(items.map((i) => parseInt(i.productId)))].filter(Boolean);
    const pr = await client.query('SELECT * FROM products WHERE id = ANY($1) AND is_active FOR UPDATE', [ids]);
    const byId = Object.fromEntries(pr.rows.map((p) => [p.id, p]));

    const lines = [];
    const wantedQty = {};
    for (const it of items) {
      const p = byId[parseInt(it.productId)];
      const qty = parseInt(it.qty);
      if (!p) throw Object.assign(new Error('A product in your cart is no longer available'), { status: 400 });
      if (!qty || qty < 1 || qty > 100) throw Object.assign(new Error('Invalid quantity'), { status: 400 });

      const chosen = {};
      for (const group of p.options || []) {
        const val = it.options && it.options[group.name];
        const ok = (group.values || []).some((v) => v.label === val);
        if (!ok) throw Object.assign(new Error(`Please choose ${group.name} for "${p.name}"`), { status: 400 });
        chosen[group.name] = val;
      }
      wantedQty[p.id] = (wantedQty[p.id] || 0) + qty;
      if (p.track_stock && wantedQty[p.id] > p.stock)
        throw Object.assign(new Error(p.stock > 0 ? `Only ${p.stock} left of "${p.name}"` : `"${p.name}" is sold out`), { status: 400 });
      lines.push({ p, qty, options: chosen });
    }

    const subtotal = lines.reduce((s, l) => s + Number(l.p.price) * l.qty, 0);
    const totalQty = lines.reduce((s, l) => s + l.qty, 0);
    const tier = (settings.discount_tiers || []).filter((t) => totalQty >= t.minQty).sort((a, b2) => b2.minQty - a.minQty)[0];
    const discount = tier ? Math.round((subtotal * tier.percent) / 100) : 0;
    const after = subtotal - discount;

    const ship = { insideDhaka: 70, outsideDhaka: 130, freeThreshold: 0, freeWithBkash: false, ...(settings.shipping || {}) };
    const inDhaka = district.toLowerCase() === 'dhaka';
    let shipping = inDhaka ? ship.insideDhaka : ship.outsideDhaka;
    if (payment === 'bkash' && ship.freeWithBkash) shipping = 0;
    if (ship.freeThreshold && after >= ship.freeThreshold) shipping = 0;
    const total = after + shipping;

    let orderNo, order;
    for (let tries = 0; tries < 5; tries++) {
      orderNo = orderNumber();
      const ex = await client.query('SELECT 1 FROM orders WHERE order_number=$1', [orderNo]);
      if (!ex.rowCount) break;
    }
    order = (await client.query(
      `INSERT INTO orders (order_number, customer_name, phone, email, district, address, notes,
         subtotal, discount, shipping_fee, total, payment_method, trx_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [orderNo, name, phone, b.email || null, district, address, b.notes || null,
        subtotal, discount, shipping, total, payment, payment === 'bkash' ? (b.trxId || null) : null])).rows[0];

    for (const l of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, price, qty, options, image) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [order.id, l.p.id, l.p.name, l.p.price, l.qty, JSON.stringify(l.options), (l.p.images || [])[0] || null]);
      if (l.p.track_stock) await client.query('UPDATE products SET stock = stock - $1 WHERE id=$2', [l.qty, l.p.id]);
    }
    await client.query('INSERT INTO order_status_history (order_id, status, note) VALUES ($1,$2,$3)', [order.id, 'pending', 'Order placed']);
    await client.query('COMMIT');
    res.status(201).json({ orderNumber: order.order_number, total, subtotal, discount, shipping, paymentMethod: payment });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// ---- Track order: needs order number + phone ----
router.post('/track', trackLimiter, asyncH(async (req, res) => {
  const no = String(req.body.orderNumber || '').trim().toUpperCase();
  const phone = normPhone(req.body.phone);
  if (!no || phone.length < 10) return res.status(400).json({ error: 'Enter your order number and phone number' });
  const o = (await query('SELECT * FROM orders WHERE order_number=$1', [no])).rows[0];
  if (!o || normPhone(o.phone) !== phone) return res.status(404).json({ error: 'No order found with these details' });
  const items = (await query('SELECT name, price, qty, options, image FROM order_items WHERE order_id=$1', [o.id])).rows;
  const history = (await query('SELECT status, note, created_at FROM order_status_history WHERE order_id=$1 ORDER BY created_at, id', [o.id])).rows;
  res.json({
    orderNumber: o.order_number, status: o.status, courierNote: o.courier_note, createdAt: o.created_at,
    customerName: o.customer_name, district: o.district, paymentMethod: o.payment_method,
    subtotal: o.subtotal, discount: o.discount, shipping: o.shipping_fee, total: o.total, items, history,
  });
}));

module.exports = router;
