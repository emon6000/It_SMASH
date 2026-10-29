# MS-MART progress (read this first when resuming)

Stack: React (Vite) + Tailwind, Node/Express, Postgres. English + Bangla (product fields `name_bn`, etc). Currency ৳.
Decisions: no customer login; cart+wishlist in localStorage; guest checkout (COD + bKash manual with TrxID);
track by order number + phone; admin adds reviews manually (no customer submissions; site tells people to order via Facebook/WhatsApp);
hero/announcement text fixed in code (not admin-editable); dummy seed products with placeholder images;
products have flexible option groups (Size only where relevant); video links on product page; hover-zoom main image + slider.
Branding: own MS-MART look, inspired by besimple75.com layout (do NOT copy their logo/photos).

## Phase 1 - DONE (tested end to end)
- [x] Postgres schema, migrate + seed (12 dummy products, 5 categories, 3 reviews)
- [x] Public API: config, categories, products (search/filter/sort/paginate), top products, product detail, reviews, orders, track
- [x] Server-side price/stock/option validation, discount tiers, shipping rules, stock deduct/restore
- [x] Admin API: login (.env), stats, upload, categories/products/reviews CRUD, orders list/filter/status/templates/CSV, settings
- [x] README with setup

## Phase 2 - DONE (tested in a real browser: browse, options validation, hover zoom, dark/Bangla, cart, checkout, order, tracking, mobile menu)
- [x] Vite + React 18 + Tailwind 3 + react-router, in `client/` (dev proxy to :5000). Colors are CSS-variable tokens (bg, fg, muted, line, soft, accent) in `src/index.css` - dark mode swaps the variables.
- [x] `src/context.jsx` holds theme, language, cart, wishlist (localStorage keys msmart_*), config/categories, drawer, toast. `t()` for UI labels, `L(obj,'name')` picks `name_bn` when Bangla is on and filled.
- [x] Pages: Home, Products, ProductPage (+Gallery with zoom/slider/video), Wishlist, Checkout, OrderSuccess, Track. Components: Header (mobile menu), Footer, CartDrawer, ProductCard, FloatingButtons.
- [x] `src/lib/pricing.js` mirrors server discount/shipping rules (server is the source of truth).
- Notes: cart stores option values by their English label (the API validates against those). No separate /cart page - drawer + checkout summary.

## Phase 3 - DONE (tested in browser: login, dashboard, order status update + templates + customer tracking sees it, product create with image upload/options/video/top, storefront shows it incl. Bangla, inline stock + hide, category, review, settings, mobile, logout)
- [x] Admin lives in `client/src/admin/` (AdminApp shell+login, Dashboard, Orders, Products, Catalog=Categories+Reviews, Settings, api.js, ui.jsx). Route `/admin/*`; App.jsx renders only AdminApp for /admin paths. Token in localStorage `msmart_admin_token`; 401 auto-logs out.
- Admin UI is English only (by design).

## Phase 4 - DONE
- [x] Server serves built `client/dist` + SPA fallback (single process in production); weak secrets refused when NODE_ENV=production; CSP off (embeds/fonts) by design.
- [x] Page titles (`useTitle`), meta/OG tags, robots.txt, admin noindex.
- [x] `db:setup:clean` (settings only, no dummy data), shipping defaults if settings missing, root `package.json` scripts, `scripts/backup.sh`, DEPLOYMENT.md.

## Project complete. Possible future ideas (not built)
Coupon codes, customer accounts, SMS/email auto-send, courier API (Pathao/Steadfast) booking, product variants with per-variant stock/price, image resizing.
