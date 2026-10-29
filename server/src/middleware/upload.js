const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const config = require('../config');

fs.mkdirSync(config.uploadDir, { recursive: true });
const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const fileFilter = (_r, file, cb) =>
  ALLOWED[file.mimetype] ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP or GIF images up to 5MB are allowed'));

const localUpload = multer({
  storage: multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, config.uploadDir),
    filename: (_r, file, cb) => cb(null, Date.now() + '-' + crypto.randomBytes(6).toString('hex') + ALLOWED[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter,
});

if (config.cloudinary.enabled) {
  module.exports = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    fileFilter,
  });
} else {
  module.exports = localUpload;
}
