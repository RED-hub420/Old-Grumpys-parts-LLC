(function () {
  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });

  const MANUALS_STORE_URL = 'https://mbnr8k-2p.myshopify.com/';

  function getProducts() {
    return window.OGP_PRODUCTS || [];
  }

  function getProductById(id) {
    return getProducts().find((p) => p.id === id);
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('ogp-cart') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('ogp-cart', JSON.stringify(cart));
    updateCartCount();
  }

  function cartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  function updateCartCount() {
    const count = cartCount();
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = count;
    });
  }

  function addToCart(productId, quantity = 1) {
    const product = getProductById(productId);
    if (!product) return;

    const cart = getCart();
    const existing = cart.find((item) => item.id === productId);

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock);
    } else {
      cart.push({ id: productId, quantity: Math.min(quantity, product.stock) });
    }

    saveCart(cart);
    showToast(`${product.name} added to cart`);
  }

  function updateQuantity(productId, quantity) {
    let cart = getCart();
    cart = cart
      .map((item) =>
        item.id === productId ? { ...item, quantity: Number(quantity) } : item
      )
      .filter((item) => item.quantity > 0);

    saveCart(cart);
    renderCartPage();
  }

  function removeFromCart(productId) {
    const cart = getCart().filter((item) => item.id !== productId);
    saveCart(cart);
    renderCartPage();
  }

  function cartDetailed() {
    return getCart()
      .map((item) => {
        const product = getProductById(item.id);
        if (!product) return null;

        return {
          ...product,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity
        };
      })
      .filter(Boolean);
  }

  function cartTotals() {
    const items = cartDetailed();
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shipping = items.length ? Math.max(95, Math.round(subtotal * 0.04)) : 0;
    const tax = Math.round(subtotal * 0.0825);
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__ogpToastTimer);
    window.__ogpToastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function renderFeatured() {
    const mount = document.querySelector('[data-featured-products]');
    if (!mount) return;

    mount.innerHTML = getProducts().slice(0, 4).map(cardMarkup).join('');
    bindAddButtons();
  }

  function cardMarkup(product) {
    return `
      <article class="product-card">
        <a class="product-media" href="product.html?id=${product.id}">
          <img src="${product.image}" alt="${product.name}">
        </a>
        <div class="product-body">
          <div class="product-meta-row">
            <span class="product-badge">${product.category}</span>
            <span class="product-sku">${product.sku}</span>
          </div>
          <h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
          <p class="product-machine">${product.machine}</p>
          <div class="product-meta-list">
            <span>${product.condition}</span>
            <span>${product.stock} in stock</span>
          </div>
          <div class="product-actions">
            <strong>${currency.format(product.price)}</strong>
            <button class="button button-primary" data-add-to-cart="${product.id}">Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }

  function bindAddButtons() {
    document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
      button.addEventListener('click', () =>
        addToCart(button.getAttribute('data-add-to-cart'))
      );
    });
  }

  function hydrateManualsStoreLinks() {
    const hasStoreUrl = Boolean(MANUALS_STORE_URL);

    document.querySelectorAll('[data-manuals-store-link]').forEach((el) => {
      if (hasStoreUrl) {
        el.setAttribute('href', MANUALS_STORE_URL);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      } else {
        el.setAttribute('href', 'contact.html');
        el.removeAttribute('target');
        el.removeAttribute('rel');
      }
    });

    document.querySelectorAll('[data-manuals-store-copy]').forEach((el) => {
      el.textContent = hasStoreUrl
        ? 'Current manuals are available in our digital store.'
        : 'Our digital manuals catalog is being updated. Contact us if you need a specific title.';
    });
  }

  function renderInventoryPage() {
    const grid = document.querySelector('[data-inventory-grid]');
    if (!grid) return;

    const searchInput = document.querySelector('[data-search]');
    const categorySelect = document.querySelector('[data-category]');
    const sortSelect = document.querySelector('[data-sort]');

    const render = () => {
      let items = [...getProducts()];
      const search = (searchInput?.value || '').toLowerCase().trim();
      const category = categorySelect?.value || 'all';
      const sort = sortSelect?.value || 'featured';

      if (search) {
        items = items.filter((item) =>
          [
            item.name,
            item.machine,
            item.category,
            item.sku,
            item.partNumber
          ]
            .join(' ')
            .toLowerCase()
            .includes(search)
        );
      }

      if (category !== 'all') {
        items = items.filter((item) => item.category === category);
      }

      if (sort === 'price-low') items.sort((a, b) => a.price - b.price);
      if (sort === 'price-high') items.sort((a, b) => b.price - a.price);
      if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));

      grid.innerHTML = items.length
        ? items.map(cardMarkup).join('')
        : '<div class="empty-state"><h3>No parts matched that search.</h3><p>Try a different machine model, part name, or category.</p></div>';

      const results = document.querySelector('[data-results-count]');
      if (results) results.textContent = `${items.length} parts found`;

      bindAddButtons();
    };

    [searchInput, categorySelect, sortSelect].forEach((el) => {
      if (el) el.addEventListener('input', render);
    });

    [categorySelect, sortSelect].forEach((el) => {
      if (el) el.addEventListener('change', render);
    });

    render();
  }

  function renderProductPage() {
    const mount = document.querySelector('[data-product-detail]');
    if (!mount) return;

    const params = new URLSearchParams(window.location.search);
    const product = getProductById(params.get('id')) || getProducts()[0];

    mount.innerHTML = `
      <div class="product-detail-layout">
        <div class="product-detail-image-wrap">
          <img src="${product.image}" alt="${product.name}" class="product-detail-image">
        </div>
        <div class="product-detail-copy">
          <span class="product-badge">${product.category}</span>
          <h1>${product.name}</h1>
          <p class="product-machine large">${product.machine}</p>
          <div class="price-row">
            <strong>${currency.format(product.price)}</strong>
            <span>${product.condition}</span>
          </div>
          <div class="spec-grid">
            <div><span>SKU</span><strong>${product.sku}</strong></div>
            <div><span>Part #</span><strong>${product.partNumber}</strong></div>
            <div><span>Weight</span><strong>${product.weight}</strong></div>
            <div><span>Stock</span><strong>${product.stock} available</strong></div>
            <div><span>Shipping</span><strong>${product.shipping}</strong></div>
            <div><span>Location</span><strong>${product.location}</strong></div>
          </div>
          <p>${product.description}</p>
          <div class="detail-actions">
            <button class="button button-primary" data-add-to-cart="${product.id}">Add to Cart</button>
            <a class="button button-secondary" href="contact.html">Ask About This Part</a>
          </div>
          <div class="detail-block">
            <h3>Fitment</h3>
            <ul>${product.fitment.map((item) => `<li>${item}</li>`).join('')}</ul>
          </div>
          <div class="detail-block">
            <h3>Highlights</h3>
            <ul>${product.features.map((item) => `<li>${item}</li>`).join('')}</ul>
          </div>
        </div>
      </div>
    `;

    bindAddButtons();
  }

  function renderCartPage() {
    const mount = document.querySelector('[data-cart-page]');
    if (!mount) return;

    const items = cartDetailed();
    const totals = cartTotals();

    if (!items.length) {
      mount.innerHTML = `
        <div class="empty-state cart-empty">
          <h2>Your cart is empty</h2>
          <p>Add a few parts to your cart to review pricing, quantities, and estimated totals.</p>
          <a class="button button-primary" href="inventory.html">Browse Inventory</a>
        </div>
      `;
      return;
    }

    mount.innerHTML = `
      <div class="cart-layout">
        <div class="cart-list">
          ${items
            .map(
              (item) => `
            <article class="cart-item">
              <img src="${item.image}" alt="${item.name}">
              <div class="cart-item-copy">
                <h3><a href="product.html?id=${item.id}">${item.name}</a></h3>
                <p>${item.machine}</p>
                <div class="cart-mini-specs">
                  <span>${item.sku}</span>
                  <span>${item.condition}</span>
                </div>
              </div>
              <div class="cart-item-controls">
                <label>
                  Qty
                  <input type="number" min="1" max="${item.stock}" value="${item.quantity}" data-qty-input="${item.id}">
                </label>
                <strong>${currency.format(item.lineTotal)}</strong>
                <button class="text-button" data-remove-item="${item.id}">Remove</button>
              </div>
            </article>
          `
            )
            .join('')}
        </div>
        <aside class="summary-card">
          <h3>Order Summary</h3>
          <div class="summary-line"><span>Subtotal</span><strong>${currency.format(totals.subtotal)}</strong></div>
          <div class="summary-line"><span>Estimated Shipping</span><strong>${currency.format(totals.shipping)}</strong></div>
          <div class="summary-line"><span>Estimated Tax</span><strong>${currency.format(totals.tax)}</strong></div>
          <div class="summary-line total"><span>Total</span><strong>${currency.format(totals.total)}</strong></div>
          <p class="summary-note">Final totals, freight, and payment details can be confirmed after the order request is reviewed.</p>
          <a class="button button-primary full-width" href="checkout.html">Proceed to Checkout</a>
        </aside>
      </div>
    `;

    document.querySelectorAll('[data-qty-input]').forEach((input) => {
      input.addEventListener('change', () =>
        updateQuantity(input.getAttribute('data-qty-input'), input.value)
      );
    });

    document.querySelectorAll('[data-remove-item]').forEach((button) => {
      button.addEventListener('click', () =>
        removeFromCart(button.getAttribute('data-remove-item'))
      );
    });
  }

  function renderCheckoutPage() {
    const mount = document.querySelector('[data-checkout-page]');
    if (!mount) return;

    const items = cartDetailed();
    const totals = cartTotals();

    mount.innerHTML = `
      <div class="checkout-layout">
        <form class="checkout-form" data-order-request>
          <div class="section-heading"><h2>Shipping Information</h2><p>Provide the details needed to review the order and shipping options.</p></div>
          <div class="form-grid">
            <label><span>First Name</span><input required value="Jane"></label>
            <label><span>Last Name</span><input required value="Doe"></label>
            <label class="full"><span>Email</span><input required type="email" value="jane@example.com"></label>
            <label class="full"><span>Street Address</span><input required value="123 Main Street"></label>
            <label><span>City</span><input required value="Weatherford"></label>
            <label><span>State</span><input required value="TX"></label>
            <label><span>ZIP</span><input required value="76086"></label>
            <label><span>Phone</span><input required value="(555) 123-4567"></label>
          </div>
          <div class="section-heading"><h2>Payment Details</h2><p>Payment and freight can be finalized after inventory and shipping are confirmed.</p></div>
          <div class="form-grid">
            <label class="full"><span>Card Number</span><input required value="4242 4242 4242 4242"></label>
            <label><span>Exp.</span><input required value="12/28"></label>
            <label><span>CVC</span><input required value="123"></label>
            <label><span>Name on Card</span><input required value="Jane Doe"></label>
          </div>
          <button class="button button-primary full-width" type="submit">Submit Order Request</button>
          <p class="summary-note">Submitting this form clears the cart locally and shows the order-request confirmation state.</p>
        </form>
        <aside class="summary-card">
          <h3>Order Summary</h3>
          ${
            items.length
              ? items
                  .map(
                    (item) =>
                      `<div class="summary-line"><span>${item.name} × ${item.quantity}</span><strong>${currency.format(item.lineTotal)}</strong></div>`
                  )
                  .join('')
              : '<p>No items in cart yet.</p>'
          }
          <div class="summary-line"><span>Subtotal</span><strong>${currency.format(totals.subtotal)}</strong></div>
          <div class="summary-line"><span>Estimated Shipping</span><strong>${currency.format(totals.shipping)}</strong></div>
          <div class="summary-line"><span>Estimated Tax</span><strong>${currency.format(totals.tax)}</strong></div>
          <div class="summary-line total"><span>Total</span><strong>${currency.format(totals.total)}</strong></div>
        </aside>
      </div>
    `;

    const form = mount.querySelector('[data-order-request]');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      localStorage.removeItem('ogp-cart');
      updateCartCount();
      showToast('Order request submitted');
      window.location.href = 'index.html?orderRequest=1';
    });
  }

  function showSuccessBanner() {
    const params = new URLSearchParams(window.location.search);
    const mount = document.querySelector('[data-home-banner]');

    if (mount && params.get('orderRequest') === '1') {
      mount.innerHTML =
        '<div class="success-banner">Order request received. A team member can follow up on availability, shipping, and payment details.</div>';
      history.replaceState({}, '', 'index.html');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderFeatured();
    hydrateManualsStoreLinks();
    renderInventoryPage();
    renderProductPage();
    renderCartPage();
    renderCheckoutPage();
    showSuccessBanner();
    bindAddButtons();
  });
})();