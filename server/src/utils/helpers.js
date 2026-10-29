const crypto = require('crypto');
const { query } = require('../db');

const slugify = (s) =>
  String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

async function uniqueSlug(table, base, fallbackPrefix, excludeId = null) {
  const slug = slugify(base) || `${fallbackPrefix}-${crypto.randomBytes(3).toString('hex')}`;
  let candidate = slug, n = 1;
  for (;;) {
    const r = await query(`SELECT id FROM ${table} WHERE slug=$1 AND ($2::int IS NULL OR id<>$2)`, [candidate, excludeId]);
    if (!r.rowCount) return candidate;
    candidate = `${slug}-${++n}`;
  }
}

function orderNumber() {
  const d = new Date();
  const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = '';
  for (let i = 0; i < 4; i++) r += chars[crypto.randomInt(chars.length)];
  return `MS-${ymd}-${r}`;
}

// last 10 digits, so 017xx..., +88017xx..., 8801xx... all match
const normPhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);

const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function getSettings() {
  const r = await query('SELECT key, value FROM settings');
  const s = {};
  r.rows.forEach((x) => (s[x.key] = x.value));
  return s;
}

module.exports = { slugify, uniqueSlug, orderNumber, normPhone, asyncH, getSettings };
