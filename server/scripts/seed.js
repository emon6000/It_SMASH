// Seeds default settings + dummy categories/products/reviews with placeholder images.
// Safe to re-run: dummy data is only added if the database has no products yet.
require('../src/config');
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');
const config = require('../src/config');

const dir = path.join(config.uploadDir, 'placeholders');
fs.mkdirSync(dir, { recursive: true });

const palette = ['#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#0891b2', '#dc2626', '#4b5563'];
function placeholder(file, label, i) {
  const c = palette[i % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
<rect width="800" height="800" fill="${c}"/><rect x="40" y="40" width="720" height="720" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4"/>
<text x="400" y="390" font-family="Arial,sans-serif" font-size="44" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>
<text x="400" y="450" font-family="Arial,sans-serif" font-size="26" fill="#fff" fill-opacity=".8" text-anchor="middle">Dummy image - replace in admin</text></svg>`;
  fs.writeFileSync(path.join(dir, file), svg);
  return `/uploads/placeholders/${file}`;
}

const sizes = { name: 'Size', name_bn: 'সাইজ', values: ['M', 'L', 'XL', '2XL'].map((l) => ({ label: l, label_bn: '' })) };
const colors = (list) => ({ name: 'Color', name_bn: 'রং', values: list.map(([l, b]) => ({ label: l, label_bn: b || '' })) });
const storage = { name: 'Storage', name_bn: 'স্টোরেজ', values: ['64GB', '128GB', '256GB'].map((l) => ({ label: l, label_bn: '' })) };

const categories = [
  { name: 'Fashion', name_bn: 'ফ্যাশন', slug: 'fashion' },
  { name: 'Electronics', name_bn: 'ইলেকট্রনিক্স', slug: 'electronics' },
  { name: 'Home & Living', name_bn: 'ঘর ও জীবনযাপন', slug: 'home-living' },
  { name: 'Beauty', name_bn: 'বিউটি', slug: 'beauty' },
  { name: 'Accessories', name_bn: 'এক্সেসরিজ', slug: 'accessories' },
];

// [name, name_bn, category slug, price, compare, stock, options, top?, videos, description, description_bn]
const products = [
  ['Classic Oversized T-Shirt', 'ক্লাসিক ওভারসাইজ টি-শার্ট', 'fashion', 990, 1250, 40, [sizes, colors([['Black', 'কালো'], ['White', 'সাদা']])], true, [], '100% cotton, relaxed drop-shoulder fit.', '১০০% কটন, আরামদায়ক ড্রপ-শোল্ডার ফিট।'],
  ['Premium Hoodie', 'প্রিমিয়াম হুডি', 'fashion', 1490, 1650, 25, [sizes], true, [], 'Heavyweight fleece hoodie.', 'ভারী ফ্লিসের হুডি।'],
  ['Cargo Pants', 'কার্গো প্যান্ট', 'fashion', 1790, null, 18, [sizes], false, [], 'Multi-pocket relaxed cargo pants.', 'অনেক পকেটওয়ালা কার্গো প্যান্ট।'],
  ['Wireless Earbuds', 'ওয়্যারলেস ইয়ারবাডস', 'electronics', 1850, 2400, 30, [colors([['Black', 'কালো'], ['White', 'সাদা']])], true, ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'], 'Bluetooth 5.3, 24-hour battery life with charging case.', 'ব্লুটুথ ৫.৩, কেসসহ ২৪ ঘণ্টা ব্যাটারি।'],
  ['Smartphone 5G', 'স্মার্টফোন ৫জি', 'electronics', 24990, 27990, 10, [storage, colors([['Midnight'], ['Blue']])], true, [], '6.6" AMOLED, 50MP camera, 5000mAh battery.', '৬.৬" অ্যামোলেড ডিসপ্লে, ৫০ মেগাপিক্সেল ক্যামেরা।'],
  ['Power Bank 20000mAh', 'পাওয়ার ব্যাংক ২০০০০mAh', 'electronics', 2250, null, 50, [], false, [], 'Fast charging power bank with dual output.', 'ফাস্ট চার্জিং পাওয়ার ব্যাংক।'],
  ['Ceramic Mug Set (4 pcs)', 'সিরামিক মগ সেট (৪ পিস)', 'home-living', 850, 1000, 35, [colors([['Mixed', 'মিক্স']])], false, [], 'Set of four glazed ceramic mugs.', 'চারটি সিরামিক মগের সেট।'],
  ['LED Table Lamp', 'এলইডি টেবিল ল্যাম্প', 'home-living', 1250, null, 22, [], true, [], 'Touch dimmer, 3 colour modes, USB powered.', 'টাচ ডিমার, ৩টি কালার মোড।'],
  ['Cotton Bedsheet Set', 'কটন বেডশিট সেট', 'home-living', 2100, 2500, 15, [{ name: 'Size', name_bn: 'সাইজ', values: [{ label: 'Single', label_bn: 'সিঙ্গেল' }, { label: 'Double', label_bn: 'ডাবল' }, { label: 'King', label_bn: 'কিং' }] }], false, [], 'Soft 100% cotton bedsheet with 2 pillow covers.', 'নরম কটন বেডশিট, ২টি বালিশের কভারসহ।'],
  ['Herbal Face Wash', 'হারবাল ফেস ওয়াশ', 'beauty', 380, 450, 80, [], false, [], 'Gentle daily face wash for all skin types.', 'সব ত্বকের জন্য মৃদু ফেস ওয়াশ।'],
  ['Leather Wallet', 'চামড়ার ওয়ালেট', 'accessories', 750, 950, 45, [colors([['Brown', 'বাদামী'], ['Black', 'কালো']])], true, [], 'Slim genuine-leather wallet with card slots.', 'আসল চামড়ার স্লিম ওয়ালেট।'],
  ['Analog Wrist Watch', 'অ্যানালগ রিস্ট ওয়াচ', 'accessories', 1650, 2000, 0, [colors([['Silver'], ['Gold']])], false, [], 'Stainless steel strap, water resistant. (Sold-out demo)', 'স্টেইনলেস স্টিল স্ট্র্যাপ, ওয়াটার রেজিস্ট্যান্ট।'],
];

(async () => {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const defaults = {
      shipping: { insideDhaka: 70, outsideDhaka: 130, freeThreshold: 2000, freeWithBkash: true },
      discount_tiers: [{ minQty: 2, percent: 6 }, { minQty: 3, percent: 12 }, { minQty: 4, percent: 14 }, { minQty: 5, percent: 16 }],
    };
    for (const [k, v] of Object.entries(defaults))
      await c.query('INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING', [k, JSON.stringify(v)]);

    if (process.argv.includes('--settings-only')) {
      await c.query('COMMIT');
      console.log('Default settings ready (no dummy data added).');
      return;
    }

    const has = (await c.query('SELECT COUNT(*)::int AS n FROM products')).rows[0].n;
    if (has > 0) {
      await c.query('COMMIT');
      console.log('Products already exist - skipped dummy data. (Use npm run db:reset to start fresh.)');
      return;
    }

    const catId = {};
    for (const [i, cat] of categories.entries()) {
      const img = placeholder(`cat-${cat.slug}.svg`, cat.name, i);
      const r = await c.query('INSERT INTO categories (name,name_bn,slug,image_url,sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id', [cat.name, cat.name_bn, cat.slug, img, i]);
      catId[cat.slug] = r.rows[0].id;
    }
    for (const [i, p] of products.entries()) {
      const [name, name_bn, cat, price, compare, stock, options, top, videos, desc, desc_bn] = p;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const imgs = [1, 2, 3].map((n) => placeholder(`${slug}-${n}.svg`, `${name} (${n})`, i + n));
      await c.query(
        `INSERT INTO products (name,name_bn,slug,description,description_bn,category_id,price,compare_price,stock,images,videos,options,is_top,top_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [name, name_bn, slug, desc, desc_bn, catId[cat], price, compare, stock, JSON.stringify(imgs), JSON.stringify(videos), JSON.stringify(options), top, i]);
    }
    const reviews = [
      ['Tanvir Ahmed', 5, 'Great quality, delivery was fast. Thank you!', 'দারুণ কোয়ালিটি, ডেলিভারি অনেক দ্রুত ছিল। ধন্যবাদ!', 'WhatsApp'],
      ['Nusrat Jahan', 5, 'Exactly like the pictures. Will order again.', 'ছবির মতোই পেয়েছি। আবার অর্ডার করব।', 'Facebook'],
      ['Rafi Hasan', 4, 'Good product, packaging could be better.', 'প্রোডাক্ট ভালো, প্যাকেজিং আরেকটু ভালো হতে পারত।', 'WhatsApp'],
    ];
    for (const r of reviews) await c.query('INSERT INTO reviews (customer_name,rating,text,text_bn,source) VALUES ($1,$2,$3,$4,$5)', r);
    await c.query('COMMIT');
    console.log(`Seeded ${categories.length} categories, ${products.length} products, ${reviews.length} reviews.`);
  } catch (e) {
    await c.query('ROLLBACK');
    console.error('Seed failed:', e.message);
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
})();
