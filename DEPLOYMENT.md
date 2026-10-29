# Deploying It SMASH

It SMASH is designed to run as a small business e-commerce app with a single Node backend and a PostgreSQL database. It keeps uploaded product images in the `uploads/` directory and serves the storefront through the same app process in production.

This is the simplest setup for a VPS or a small Linux server. It is an ideal fit for a store that needs a live website, admin dashboard, product uploads, and order tracking without a large cloud architecture.

## Recommended setup

- Ubuntu 22.04 or 24.04 server
- 1 GB RAM is enough for a small store
- PostgreSQL database
- Nginx as reverse proxy
- PM2 for process management
- Let’s Encrypt for HTTPS

> This app is not a pure static website. It needs a database and writable image storage, so a simple static host is not enough.

## Pre-deployment checklist

Before go-live, make sure you have:

- [ ] a domain name and DNS record pointing to the VPS
- [ ] a strong `ADMIN_PASSWORD`
- [ ] a long random `JWT_SECRET`
- [ ] real business contact info in `server/.env`
- [ ] final product catalog or empty store ready to launch
- [ ] a backup strategy for database and uploads

## 1. Server preparation

```bash
sudo apt update && sudo apt install -y postgresql nginx git unzip curl

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

## 2. Create PostgreSQL database

```bash
sudo -u postgres psql <<'SQL'
CREATE USER msmart WITH PASSWORD 'PUT_A_STRONG_DB_PASSWORD_HERE';
CREATE DATABASE msmart OWNER msmart;
SQL
```

## 3. Upload the project

Upload the project ZIP or repository folder to the server:

```bash
scp -r /path/to/It_SMASH user@SERVER_IP:~
```

Then enter the project folder:

```bash
cd ~/It_SMASH
cp server/.env.example server/.env
nano server/.env
```

Set the production values in `server/.env`:

```env
PORT=5000
CLIENT_URL=https://yourdomain.com
DATABASE_URL=postgresql://msmart:YOUR_PASSWORD@localhost:5432/msmart
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-long-strong-password
JWT_SECRET=your-very-long-random-secret
SITE_NAME=It SMASH
WHATSAPP_NUMBER=8801XXXXXXXXX
FACEBOOK_URL=https://www.facebook.com/profile.php?id=61595713630252
CONTACT_PHONE=01XXXXXXXXX
BKASH_NUMBER=01XXXXXXXXX
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=it-smash/products
```

Cloudinary login details are taken from your Cloudinary dashboard: https://cloudinary.com/console

Generate a secure secret if needed:

```bash
openssl rand -hex 32
```

## 4. Install and build the app

```bash
npm run install:all
npm run build
```

Choose one of the following database setup commands:

```bash
npm run db:setup:clean
```

This creates tables and default store settings without dummy products.

Or, if you want a demo catalog first:

```bash
npm run db:setup
```

## 5. Start the app with PM2

```bash
NODE_ENV=production pm2 start server/src/index.js --name it-smash
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup` to ensure PM2 starts again after reboot.

Check health:

```bash
curl http://localhost:5000/api/health
```

Expected output:

```json
{"ok":true}
```

## 6. Configure Nginx

Create a site config:

```bash
sudo nano /etc/nginx/sites-available/it-smash
```

Example config:

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/it-smash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Enable HTTPS with Let’s Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

This gives you HTTPS and a valid certificate automatically.

Your store is then available at:

- https://yourdomain.com
- https://yourdomain.com/admin

## 8. Updating the site later

When you deploy new code:

```bash
cd ~/It_SMASH
npm run install:all
npm run build
pm2 restart it-smash
```

If you only changed `server/.env`, restart the app:

```bash
pm2 restart it-smash --update-env
```

## Backup plan

You should back up both the database and uploaded media regularly.

Create a backup script:

```bash
mkdir -p backups
```

Then use a simple shell script to dump the database and copy uploads.

Example:

```bash
DATE=$(date +%F_%H%M)
mkdir -p backups/$DATE
pg_dump "$DATABASE_URL" > backups/$DATE/db.sql
tar -czf backups/$DATE/uploads.tar.gz uploads
```

Recommended schedule:

```bash
crontab -e
0 3 * * 0 cd /home/YOUR_USER/It_SMASH && bash -lc 'DATE=$(date +%F_%H%M); mkdir -p backups/$DATE; pg_dump "$DATABASE_URL" > backups/$DATE/db.sql; tar -czf backups/$DATE/uploads.tar.gz uploads'
```

Keep a copy of backups off-server too.

## Using other hosting providers

This app can also work on managed hosting platforms, but you need:

1. a managed PostgreSQL instance and the connection string in `DATABASE_URL`
2. a persistent storage volume mounted to `uploads/`
3. build command: `npm run install:all && npm run build`
4. start command: `NODE_ENV=production npm start`

A VPS is still the simplest and most predictable option for a small store like this.

## Daily operations

- New order arrives → open admin and handle it in Orders
- After confirmation, change status to Confirmed / Processing / Shipped
- Add courier note and tracking info if needed
- When delivered, mark it as Delivered
- If cancelled or returned, status is updated and stock is restored automatically
- Review customer feedback and add it through the admin panel

## Common production issues

### Site loads but products are empty
- Check `DATABASE_URL`
- Check if database setup was run
- Look at PM2 logs:

```bash
pm2 logs it-smash
```

### “Refusing to start in production”
- Make `ADMIN_PASSWORD` stronger than 8 chars
- Make `JWT_SECRET` longer than 24 chars

### Image uploads fail
- Increase nginx `client_max_body_size`
- Ensure `uploads/` is writable by the user running PM2

### WhatsApp/Facebook links are missing
- Fill `WHATSAPP_NUMBER` / `FACEBOOK_URL`
- Restart app

```bash
pm2 restart it-smash --update-env
```

### .env changes not taking effect
- The app reads environment variables on startup
- Restart the app after editing the file

## Final note

This deployment approach keeps the system simple and reliable for a small business, while still giving you a proper storefront, admin center, PostgreSQL data layer, and product image uploads. It is a practical production setup for It SMASH without unnecessary complexity.