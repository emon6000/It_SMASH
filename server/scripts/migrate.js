require('../src/config');
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

(async () => {
  try {
    if (process.argv.includes('--drop')) {
      await pool.query('DROP TABLE IF EXISTS order_status_history, order_items, orders, reviews, products, categories, settings CASCADE');
      console.log('Dropped all tables.');
    }
    await pool.query(fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8'));
    console.log('Schema ready.');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
