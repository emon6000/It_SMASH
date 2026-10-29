# It SMASH

It SMASH is a modern Bangladeshi e-commerce storefront and admin system built with React, Vite, Express, and PostgreSQL. It includes a customer-facing storefront, product catalog, filter/sort system, cart, wishlist, checkout, order tracking, and a full admin dashboard for managing products, orders, settings, reviews, and categories.

This project is designed for a local business that wants a clean, conversion-focused store with both English and Bangla support, dark/light mode, and simple operational tools for a small team.

For live deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Tech stack

- Frontend: React 18 + Vite + React Router
- Styling: Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JWT-based admin login
- File uploads: Multer
- Security: Helmet + CORS + rate limiting

## Project goals

- Sell products through a clean storefront
- Support English and Bangla content
- Provide dark and light UI modes
- Allow product filtering and sorting
- Support cart, wishlist, checkout, and order tracking
- Give admins a lightweight control panel to run the store
- Keep setup simple enough for a local or small-hosted business environment

## Features

### Customer storefront
- Hero section with promotional layout
- Top products and category browsing
- Product grid with filters and sorting
- Product detail page with options, gallery, videos, and related items
- Search across products
- Cart drawer and wishlist with browser storage
- Checkout with shipping and discount calculation
- Tracking page using order number + phone
- Facebook/WhatsApp/social contact links
- Light/dark theme toggle
- English/Bangla interface toggle

### Admin panel
- Dashboard with order stats and summaries
- Orders listing and detail view
- Order status management
- Courier/tracking notes for customers
- Product creation and editing
- Category management
- Review management
- Store settings and pricing configuration
- Uploads for product images
- Quick toggles for top products and stock visibility

### Business logic included
- Product discount calculations
- District-based shipping logic
- Minimum-order free shipping logic
- Buy-more-save-more tiers
- Order numbering generation
- Stock deduction / restore on order status changes
- Tracking flow tied to order number and customer phone

## Repository structure

```text
It_SMASH/
├── client/                  # React storefront + admin frontend
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/                  # Express API + Postgres integration
│   ├── src/
│   ├── scripts/
│   ├── .env.example
│   ├── package.json
│   └── .env
├── uploads/                 # Uploaded product and media files
├── .gitignore
├── DEPLOYMENT.md
├── README.md
├── package.json             # Root scripts for common tasks
├── PROGRESS.md              # Internal development notes
└── scripts/
```

## Requirements

- Node.js 18+
- PostgreSQL 13+
- npm

Check versions:

```bash
node -v
npm -v
psql --version
```

## Local setup

### 1) Create PostgreSQL database

Linux/macOS:

```bash
sudo -u postgres psql -c "CREATE DATABASE msmart;"
```

Windows: open PostgreSQL SQL Shell or pgAdmin and run:

```sql
CREATE DATABASE msmart;
```

### 2) Create environment file

Inside `server/`:

```bash
cp .env.example .env
```

Then update the values in `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/msmart
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
JWT_SECRET=your-long-random-string
SITE_NAME=It SMASH
WHATSAPP_NUMBER=8801700000000
FACEBOOK_URL=https://www.facebook.com/profile.php?id=61595713630252
CONTACT_PHONE=01700-000000
BKASH_NUMBER=01700-000000
```

Important env fields:
- `DATABASE_URL`: your PostgreSQL connection string
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: admin login for `/admin`
- `JWT_SECRET`: long secret for JWT auth
- `SITE_NAME`: public brand name
- `FACEBOOK_URL`: store Facebook page/profile
- `WHATSAPP_NUMBER`: store contact number for WhatsApp links
- `BKASH_NUMBER`: bKash number used in checkout
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: image storage credentials; get them from the Cloudinary dashboard and keep them in `server/.env`
- `CLOUDINARY_FOLDER`: optional subfolder on Cloudinary for product images

For production image uploads, Cloudinary is the recommended setup. If the Cloudinary keys are present, the admin upload route automatically uploads images to Cloudinary and stores the public URLs in the database. If they are not present, the app falls back to the local `uploads/` folder for local development.

### 3) Install dependencies

From the root:

```bash
npm install
```

This project also includes top-level scripts that delegate to the server and client apps.

### 4) Set up database schema and seed data

```bash
npm run db:setup
```

This runs migrations and inserts demo data including categories, products, reviews, and settings.

To reset the database and reseed:

```bash
npm run db:reset
```

### 5) Run the API

```bash
npm run dev:server
```

API should run at:

- http://localhost:5000
- Health check: http://localhost:5000/api/health

### 6) Run the client

Open a second terminal and run:

```bash
npm run dev:client
```

Storefront should open at:

- http://localhost:5173

### 7) Open admin panel

Open:

- http://localhost:5173/admin

Use the admin credentials from `server/.env`.

## Root scripts

From the project root:

```bash
npm run install:all
npm run db:setup
npm run db:reset
npm run db:setup:clean
npm run dev:server
npm run dev:client
npm run build
npm run start
```

## Common commands

### Server commands

```bash
cd server
npm install
npm run dev
npm run db:setup
npm run db:reset
npm run db:setup:clean
npm start
```

### Client commands

```bash
cd client
npm install
npm run dev
npm run build
npm run preview
```

## Storefront behavior

### Product catalog
- Search by keyword
- Filter by category
- Price range filtering
- In-stock filter
- Sorting by newest, price ascending/descending, name A-Z/Z-A
- Load more pagination

### Product detail flow
- Large gallery with primary image and alternate images
- Optional product video links
- Product options such as size, color, storage, etc.
- Quantity controls
- Add to cart or buy now
- Favorite/wishlist action
- Related products section

### Checkout flow
- Delivery address and district fields
- Shipping calculation
- Discount calculation based on settings
- COD or bKash payment option
- Order confirmation and order number generation

### Tracking flow
Customers can track an order using:
- order number
- phone number

The tracking page shows status history and courier information.

## Admin features

### Dashboard
- Pending orders
- Sales and order totals
- Delivered revenue
- Status breakdown
- Inventory alerts
- Recent orders

### Orders
- List/search/filter by status
- View customer and address info
- Order item summary
- Payment details
- Update order status
- Add customer-facing note or courier note
- Generate template text for WhatsApp or email

### Products
- Add/edit/remove products
- Upload images
- Set prices and compare prices
- Set stock tracking behavior
- Add Bangla/English values
- Add option groups
- Mark products as top products

### Categories and reviews
- Add categories with image and order
- Manage review content and visibility
- Manage branding and contact info settings

## Configuration and pricing

Pricing and delivery logic are controlled in the admin settings and seeded defaults.

Default logic includes:
- Dhaka delivery fee
- Outside Dhaka delivery fee
- Free shipping above a threshold
- Free shipping with bKash payment option
- Quantity-based discount tiers

These settings are editable through the admin UI and can be changed in the backend config layer.

## API reference

### Public endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/config` | Site metadata, shipping rules, discount tiers |
| GET | `/api/categories` | Active categories |
| GET | `/api/products` | Product listing with filters and sorting |
| GET | `/api/products/top` | Top products |
| GET | `/api/products/:slug` | Product detail + related products |
| GET | `/api/reviews` | Reviews to display |
| POST | `/api/orders` | Place new order |
| POST | `/api/track` | Track order by order number and phone |

### Order request example

```json
{
  "name": "Rafi Ahmed",
  "phone": "01712345678",
  "email": "rafi@example.com",
  "district": "Dhaka",
  "address": "Mirpur Road, Dhaka",
  "notes": "Please call before delivery",
  "paymentMethod": "cod",
  "trxId": "",
  "items": [
    {
      "productId": 1,
      "qty": 2,
      "options": {
        "Size": "L",
        "Color": "Black"
      }
    }
  ]
}
```

### Admin endpoints

Admin routes are protected by JWT authorization.

| Method | Route | Description |
|---|---|---|
| POST | `/api/admin/login` | Login and get JWT |
| GET | `/api/admin/stats` | Dashboard stats |
| POST | `/api/admin/upload` | Image upload |
| GET/POST/PATCH/DELETE | `/api/admin/categories` | Category management |
| GET/POST/PATCH/DELETE | `/api/admin/products` | Product management |
| GET/POST/PATCH/DELETE | `/api/admin/reviews` | Review management |
| GET | `/api/admin/orders` | List orders |
| GET/PATCH | `/api/admin/orders/:id` | Order detail and updates |
| PATCH | `/api/admin/orders/:id/status` | Update order status |
| GET | `/api/admin/orders-export.csv` | Export CSV |
| GET/PUT | `/api/admin/settings` | Store configuration |

## Security notes

- Keep `server/.env` out of version control
- Use a strong `ADMIN_PASSWORD`
- Use a unique `JWT_SECRET`
- Do not expose the database connection in public repos
- Use the deployment guide for production hosting and TLS setup

## Troubleshooting

### Common issues

- `Missing DATABASE_URL` or `Missing JWT_SECRET`:
  - check `server/.env`
- `password authentication failed`:
  - verify credentials in `DATABASE_URL`
- `database "msmart" does not exist`:
  - create the Postgres database first
- API not responding:
  - ensure `npm run dev:server` is running
- Storefront showing blank data:
  - make sure the API is running on port 5000 and CORS is configured
- Images not loading:
  - ensure uploads folder exists and is writable
- Fonts not loading:
  - internet access is required for Google Fonts

## Production notes

For production deployment, use the steps in [DEPLOYMENT.md](./DEPLOYMENT.md). The project is designed to run as a single Node-based backend serving the API and frontend static resources in production, but the recommended setup is still to use a proper reverse proxy and managed PostgreSQL service.

## License

This project is for internal business use and is not published as a public package. Add your own license if you plan to distribute the code externally.

## Final note

It SMASH is built as a practical small-business storefront and admin system rather than a generic template. The main business flows are in place and ready for local customization, product data entry, and deployment.
