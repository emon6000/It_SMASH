const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

for (const k of ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_PASSWORD']) {
  if (!process.env[k]) {
    console.error(`Missing ${k} in server/.env (copy .env.example to .env first)`);
    process.exit(1);
  }
}

if (process.env.NODE_ENV === 'production') {
  const weak = (v, min) => !v || v.startsWith('change-this') || v.length < min;
  if (weak(process.env.JWT_SECRET, 24) || weak(process.env.ADMIN_PASSWORD, 8)) {
    console.error('Refusing to start in production: set a strong ADMIN_PASSWORD (8+ chars) and a long random JWT_SECRET (24+ chars) in server/.env');
    process.exit(1);
  }
}

const cloudinaryEnabled = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

module.exports = {
  port: Number(process.env.PORT) || 5000,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  uploadDir: path.join(__dirname, '../../uploads'),
  cloudinary: {
    enabled: cloudinaryEnabled,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'it-smash/products',
  },
  site: {
    name: process.env.SITE_NAME || 'It SMASH',
    whatsapp: process.env.WHATSAPP_NUMBER || '',
    facebook: process.env.FACEBOOK_URL || 'https://www.facebook.com/profile.php?id=61595713630252',
    phone: process.env.CONTACT_PHONE || '',
    bkash: process.env.BKASH_NUMBER || '',
  },
};
