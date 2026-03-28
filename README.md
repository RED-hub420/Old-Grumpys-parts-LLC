# Old Grumpy's Parts Demo Site

Static multi-page storefront demo built for GitHub Pages.

## Pages included
- `index.html` — homepage / brand pitch
- `inventory.html` — searchable demo inventory
- `product.html?id=...` — product detail page driven by JS data
- `cart.html` — working cart using localStorage
- `checkout.html` — polished checkout mockup
- `about.html` — business story page
- `contact.html` — placeholder contact page

## Notes
- Contact info uses placeholder demo data for now.
- Cart is local only and not tied to live payment processing.
- Inventory is driven from `assets/js/products.js`.
- Logo used: current selected Old Grumpy's Parts image asset.

## GitHub Pages deploy
1. Upload all files in this folder to a GitHub repository.
2. In GitHub repo settings, enable **Pages**.
3. Set deploy source to the root of the main branch.
4. Point your subdomain to the GitHub Pages address.

## Smart next upgrades
- Replace placeholder contact info
- Replace SVG placeholders with real part photos
- Add real categories and machine brands
- Connect to Stripe / Shopify / WooCommerce if needed
- Or use the site as the branded front-end and route checkout to eBay
