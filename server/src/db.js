const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (e) => console.error('Postgres pool error:', e.message));
module.exports = { pool, query: (t, p) => pool.query(t, p) };
