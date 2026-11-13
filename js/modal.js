/**
 * ==========================================================================
 * ÉLÉGANCE PARIS - MODALS & NOTIFICATIONS
 * Handles Quick View modal, Checkout flow, Confetti, and Toast notifications
 * ==========================================================================
 */

const ORDERS_STORAGE_KEY = 'elegance_orders';

/**
 * Toast Notification Helper
 */
window.showToast = function(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? 'ri-checkbox-circle-fill' :
               type === 'error' ? 'ri-error-warning-fill' : 'ri-information-fill';

  toast.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('show'));

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
};

/**
 * Quick View Modal Logic
 */
let currentModalProduct = null;
let modalQuantity = 1;

window.openQuickView = async function(productId) {
  const modal = document.getElementById('quickViewModal');
  const content = document.getElementById('quickViewContent');
  if (!modal || !content) return;

  modal.classList.add('active');
  content.innerHTML = `
    <div style="text-align: center; padding: 60px 20px;">
      <i class="ri-loader-4-line" style="font-size: 2.5rem; animation: spin 1s linear infinite; display: inline-block; color: var(--accent);"></i>
      <p style="margin-top: 12px; color: var(--text-muted);">Curating product details...</p>
    </div>
  `;

  // Fetch full details
  const product = await fetchProductById(productId);
  if (!product) {
    content.innerHTML = `<div style="padding: 40px; text-align: center;"><p>Could not load product details. Please try again.</p></div>`;
    return;
  }

  currentModalProduct = product;
  modalQuantity = 1;

  const images = (product.images && product.images.length > 0) ? product.images : [product.thumbnail];
  const oldPrice = product.discountPercentage 
    ? (product.price / (1 - (product.discountPercentage / 100))).toFixed(2) 
    : (product.price * 1.2).toFixed(2);

  // Render modal content
  content.innerHTML = `
    <div class="quickview-grid">
      <!-- Gallery Column -->
      <div class="quickview-gallery">
        <div class="gallery-main">
          <img id="qvMainImage" src="${images[0]}" alt="${product.title}" onerror="this.src='https://placehold.co/400x400?text=Fashion'">
        </div>
        <div class="gallery-thumbs">
          ${images.slice(0, 5).map((img, idx) => `
            <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="window.switchQvImage('${img}', this)">
              <img src="${img}" alt="Thumbnail ${idx + 1}" onerror="this.src='https://placehold.co/64x64?text=Fashion'">
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Product Details Column -->
      <div class="quickview-details">
        <span class="qv-category">${product.category.replace('-', ' ')}</span>
        <h2 class="qv-title">${product.title}</h2>
        
        <div class="qv-rating">
          <div>
            ${renderStars(product.rating)}
          </div>
          <span style="color: var(--primary); font-weight: 600;">${product.rating ? Number(product.rating).toFixed(1) : '4.8'}</span>
          <span style="color: var(--text-muted);">(${product.reviews?.length || 18} customer reviews)</span>
        </div>

        <div class="qv-price-box">
          <span class="qv-price">$${Number(product.price).toFixed(2)}</span>
          <span class="qv-old-price">$${oldPrice}</span>
          ${product.discountPercentage ? `<span class="badge badge-discount">Save ${Math.round(product.discountPercentage)}%</span>` : ''}
        </div>

        <p class="qv-desc">${product.description || 'Elevate your wardrobe with this carefully crafted piece featuring timeless silhouette, premium materials, and exquisite attention to luxury finishes.'}</p>

        <ul class="qv-meta-list">
          <li><strong>Availability:</strong> <span style="color: ${product.stock > 5 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">${product.stock > 0 ? (product.stock < 10 ? `Only ${product.stock} left in stock!` : 'In Stock & Ready to Ship') : 'Out of Stock'}</span></li>
          <li><strong>Brand:</strong> ${product.brand || 'Élégance Paris'}</li>
          <li><strong>Shipping:</strong> ${product.shippingInformation || 'Dispatches within 24-48 business hours'}</li>
          <li><strong>Returns:</strong> ${product.returnPolicy || 'Complimentary 30-day luxury returns'}</li>
        </ul>

        <div class="qv-actions">
          <div class="qty-counter" style="height: 48px;">
            <button class="qty-btn" style="width: 40px; height: 100%; font-size: 1.1rem;" onclick="window.updateQvQty(-1)">-</button>
            <span id="qvQtyDisplay" class="qty-num" style="width: 48px; font-size: 1rem;">1</span>
            <button class="qty-btn" style="width: 40px; height: 100%; font-size: 1.1rem;" onclick="window.updateQvQty(1)">+</button>
          </div>

          <button class="btn btn-primary" style="flex-grow: 1; height: 48px;" onclick="window.addQvToCart()">
            <i class="ri-shopping-bag-line"></i> Add to Shopping Bag
          </button>

          <button class="btn btn-outline btn-wishlist-toggle" style="width: 48px; height: 48px; padding: 0;" data-id="${product.id}" onclick="window.wishlist.toggle(window.currentModalProduct)">
            <i class="${window.wishlist.isWishlisted(product.id) ? 'ri-heart-fill' : 'ri-heart-line'}" style="${window.wishlist.isWishlisted(product.id) ? 'color: var(--danger);' : ''}"></i>
          </button>
        </div>
      </div>
    </div>
  `;
};

window.switchQvImage = function(src, thumbElement) {
  const main = document.getElementById('qvMainImage');
  if (main) main.src = src;

  const thumbs = document.querySelectorAll('.thumb-item');
  thumbs.forEach(t => t.classList.remove('active'));
  if (thumbElement) thumbElement.classList.add('active');
};

window.updateQvQty = function(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  const display = document.getElementById('qvQtyDisplay');
  if (display) display.textContent = modalQuantity;
};

window.addQvToCart = function() {
  window.closeModal('quickViewModal');
  window.location.href = '404.html';
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
};

/**
 * Drawer Handlers (Cart, Wishlist, Mobile Nav)
 */
window.openDrawer = function(drawerId) {
  const drawer = document.getElementById(drawerId);
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer && backdrop) {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeDrawer = function(drawerId) {
  const drawer = document.getElementById(drawerId);
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) drawer.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
  document.body.style.overflow = '';
};

window.closeAllDrawers = function() {
  document.querySelectorAll('.drawer, .mobile-nav-drawer').forEach(d => d.classList.remove('active'));
  const backdrop = document.getElementById('drawerBackdrop');
  if (backdrop) backdrop.classList.remove('active');
  document.body.style.overflow = '';
};

/**
 * Checkout & Order Placement Logic
 */
window.openCheckoutModal = function() {
  if (window.cart.items.length === 0) {
    window.showToast('Your shopping bag is empty!', 'error');
    return;
  }
  window.closeDrawer('cartDrawer');
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    renderCheckoutSummary();
    modal.classList.add('active');
  }
};

function renderCheckoutSummary() {
  const totals = window.cart.getTotals();
  const summaryBox = document.getElementById('checkoutSummaryBox');
  if (!summaryBox) return;

  summaryBox.innerHTML = `
    <h4 style="font-size: 1.1rem; margin-bottom: 16px; font-weight: 700;">Order Summary (${totals.itemCount} items)</h4>
    <div style="max-height: 200px; overflow-y: auto; margin-bottom: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
      ${window.cart.items.map(item => `
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 8px;">
          <span>${item.quantity}x ${item.title.slice(0, 26)}...</span>
          <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
        </div>
      `).join('')}
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px;">
      <span>Subtotal:</span>
      <span>$${totals.subtotal.toFixed(2)}</span>
    </div>
    ${totals.discount > 0 ? `
      <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--success); margin-bottom: 6px;">
        <span>Promo Discount:</span>
        <span>-$${totals.discount.toFixed(2)}</span>
      </div>
    ` : ''}
    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px;">
      <span>Shipping:</span>
      <span>${totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 12px;">
      <span>Est. Tax (5%):</span>
      <span>$${totals.tax.toFixed(2)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 700; color: var(--primary); border-top: 1px solid var(--border-medium); padding-top: 12px;">
      <span>Total to Pay:</span>
      <span style="color: var(--accent);">$${totals.grandTotal.toFixed(2)}</span>
    </div>
  `;
}

window.handleCheckoutSubmit = function(event) {
  event.preventDefault();

  const form = event.target;
  const fullName = form.fullName ? form.fullName.value.trim() : '';
  const email = form.email ? form.email.value.trim() : '';
  const address = form.address ? form.address.value.trim() : '';
  const city = form.city ? form.city.value.trim() : '';
  const zip = form.zip ? form.zip.value.trim() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!fullName || fullName.length < 3) {
    window.showToast('Please enter your full legal name (minimum 3 characters).', 'error');
    if (form.fullName) form.fullName.focus();
    return;
  }

  if (!email || !emailRegex.test(email)) {
    window.showToast('Please enter a valid email address for order confirmation.', 'error');
    if (form.email) form.email.focus();
    return;
  }

  if (!address || address.length < 5) {
    window.showToast('Please provide a complete delivery street address.', 'error');
    if (form.address) form.address.focus();
    return;
  }

  if (!city || city.length < 2) {
    window.showToast('Please specify a valid delivery city.', 'error');
    if (form.city) form.city.focus();
    return;
  }

  if (!zip || zip.length < 3) {
    window.showToast('Please enter a valid postal code.', 'error');
    if (form.zip) form.zip.focus();
    return;
  }

  // All checkout validations passed!
  const totals = window.cart.getTotals();
  const orderId = 'ELG-' + Math.floor(100000 + Math.random() * 900000);

  // Clear Cart
  window.cart.clearCart();

  // Confetti celebration
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  window.showToast(`Order ${orderId} verified & processed! Redirecting to lookbook...`, 'success');
  setTimeout(() => {
    window.closeModal('checkoutModal');
    window.location.href = '404.html';
  }, 1000);
};

/**
 * Render Star Rating helper
 */
function renderStars(rating = 5) {
  const rounded = Math.round(rating);
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) {
      starsHtml += '<i class="ri-star-fill"></i>';
    } else {
      starsHtml += '<i class="ri-star-line"></i>';
    }
  }
  return starsHtml;
}
window.renderStars = renderStars;

/**
 * ==========================================================================
 * USER AUTHENTICATION & LOGIN MODAL
 * ==========================================================================
 */
const USER_STORAGE_KEY = 'stackly_user';

window.getLoggedInUser = function() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
    const name = (parsed.name || parsed.fullName || parsed.username || '').trim();
    if (!name || name === 'undefined' || name.toLowerCase() === 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
    parsed.name = name;
    return parsed;
  } catch (e) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

window.openAuthModal = function() {
  const modal = document.getElementById('authModal');
  const content = document.getElementById('authModalContent');
  if (!modal || !content) return;

  const user = window.getLoggedInUser();

  if (user) {
    // Show logged in profile overview
    content.innerHTML = `
      <div style="text-align: center; padding: 10px 0;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--accent-subtle); color: var(--accent); font-size: 1.8rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; border: 2px solid var(--accent);">
          <i class="ri-user-smile-line"></i>
        </div>
        <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--primary); margin-bottom: 4px;">Hello, ${user.name}!</h3>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 20px;">${user.email} &bull; <strong style="color: var(--accent);">VIP Member</strong></p>

        <div style="background: var(--bg-alt); border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px; text-align: left; font-size: 0.88rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Membership tier:</span>
            <strong>Haute Couture Gold</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Active coupon:</span>
            <strong style="color: var(--accent);">LUXE20 (20% Off)</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Free Express Delivery:</span>
            <strong style="color: var(--success);"><i class="ri-check-line"></i> Active</strong>
          </div>
        </div>

        <button class="btn btn-outline" style="width: 100%;" onclick="window.handleLogout()">
          <i class="ri-logout-box-r-line"></i> Sign Out
        </button>
      </div>
    `;
  } else {
    // Show Login & Register tabbed form
    content.innerHTML = `
      <div>
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="assets/logo_0967.webp" alt="Stackly Logo" style="height: 38px; margin: 0 auto 10px auto; object-fit: contain;">
          <h3 style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--primary);">Welcome Back</h3>
          <p style="font-size: 0.86rem; color: var(--text-muted);">Sign in to access your luxury wishlist & orders</p>
        </div>

        <!-- Auth Tabs -->
        <div style="display: flex; border-bottom: 1px solid var(--border-light); margin-bottom: 20px;">
          <button id="authTabLogin" class="auth-tab active" onclick="window.switchAuthTab('login')" style="flex: 1; padding: 10px; font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid var(--accent); color: var(--primary);">Sign In</button>
          <button id="authTabRegister" class="auth-tab" onclick="window.switchAuthTab('register')" style="flex: 1; padding: 10px; font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid transparent; color: var(--text-muted);">Create Account</button>
        </div>

        <!-- Login Form -->
        <form id="authLoginForm" onsubmit="window.handleLoginSubmit(event)">
          <div class="form-group">
            <label for="loginEmail">Email Address</label>
            <input type="email" id="loginEmail" placeholder="you@domain.com" required value="eleanor@stackly.com">
          </div>
          <div class="form-group">
            <label for="loginPassword">Password</label>
            <input type="password" id="loginPassword" placeholder="••••••••" required value="fashion2026">
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; font-size: 0.82rem;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" checked> Remember me
            </label>
            <a href="#" onclick="window.showToast('Password reset link sent to your email!', 'info'); return false;" style="color: var(--accent); font-weight: 500;">Forgot Password?</a>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: 12px;">
            Sign In to Account
          </button>
          <button type="button" class="btn btn-outline btn-sm" style="width: 100%;" onclick="window.loginAsDemo()">
            <i class="ri-flashlight-line"></i> Quick Demo VIP Login
          </button>
        </form>

        <!-- Register Form (hidden by default) -->
        <form id="authRegisterForm" style="display: none;" onsubmit="window.handleRegisterSubmit(event)">
          <div class="form-group">
            <label for="regName">Full Name</label>
            <input type="text" id="regName" placeholder="Eleanor Vance" required>
          </div>
          <div class="form-group">
            <label for="regEmail">Email Address</label>
            <input type="email" id="regEmail" placeholder="you@domain.com" required>
          </div>
          <div class="form-group">
            <label for="regPassword">Create Password</label>
            <input type="password" id="regPassword" placeholder="At least 6 characters" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
            Create VIP Account
          </button>
        </form>
      </div>
    `;
  }

  modal.classList.add('active');
};

window.switchAuthTab = function(tab) {
  const loginTab = document.getElementById('authTabLogin');
  const regTab = document.getElementById('authTabRegister');
  const loginForm = document.getElementById('authLoginForm');
  const regForm = document.getElementById('authRegisterForm');

  if (tab === 'login') {
    loginTab.style.borderBottomColor = 'var(--accent)';
    loginTab.style.color = 'var(--primary)';
    regTab.style.borderBottomColor = 'transparent';
    regTab.style.color = 'var(--text-muted)';
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
  } else {
    regTab.style.borderBottomColor = 'var(--accent)';
    regTab.style.color = 'var(--primary)';
    loginTab.style.borderBottomColor = 'transparent';
    loginTab.style.color = 'var(--text-muted)';
    loginForm.style.display = 'none';
    regForm.style.display = 'block';
  }
};

window.handleLoginSubmit = function(event) {
  event.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    window.showToast('Please enter a valid email address.', 'error');
    if (emailInput) emailInput.focus();
    return;
  }

  if (!password || password.length < 6) {
    window.showToast('Password must contain at least 6 characters.', 'error');
    if (passInput) passInput.focus();
    return;
  }

  const name = email.split('@')[0];
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  const user = { name: capitalized, email };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  window.closeModal('authModal');
  window.updateAuthUI();
  window.showToast(`Welcome back, ${capitalized}! Redirecting to lookbook...`, 'success');
  setTimeout(() => {
    window.location.href = '404.html';
  }, 800);
};

window.handleRegisterSubmit = function(event) {
  event.preventDefault();
  const nameInput = document.getElementById('regName');
  const emailInput = document.getElementById('regEmail');
  const passInput = document.getElementById('regPassword');
  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || name.length < 2) {
    window.showToast('Please enter your full name (minimum 2 characters).', 'error');
    if (nameInput) nameInput.focus();
    return;
  }

  if (!email || !emailRegex.test(email)) {
    window.showToast('Please enter a valid email address.', 'error');
    if (emailInput) emailInput.focus();
    return;
  }

  if (!password || password.length < 6) {
    window.showToast('Password must contain at least 6 characters.', 'error');
    if (passInput) passInput.focus();
    return;
  }

  const user = { name, email };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  window.closeModal('authModal');
  window.updateAuthUI();
  window.showToast(`VIP Account created successfully! Welcome, ${name}. Redirecting...`, 'success');
  setTimeout(() => {
    window.location.href = '404.html';
  }, 800);
};

window.loginAsDemo = function() {
  const user = { name: 'Eleanor', email: 'eleanor.vance@stackly.com' };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  window.closeModal('authModal');
  window.updateAuthUI();
  window.showToast('Signed in as Demo VIP Member: Eleanor. Redirecting...', 'success');
  setTimeout(() => {
    window.location.href = '404.html';
  }, 800);
};

window.handleLogout = function() {
  localStorage.removeItem(USER_STORAGE_KEY);
  window.closeModal('authModal');
  window.updateAuthUI();
  window.showToast('You have been signed out.', 'info');
};

window.updateAuthUI = function() {
  const user = window.getLoggedInUser();
  const navBtn = document.getElementById('navLoginBtn');
  const mobileText = document.getElementById('mobileLoginText');

  if (navBtn) {
    navBtn.classList.remove('logged-in');
    navBtn.title = user ? `Account: ${user.name}` : 'Account Login';
    navBtn.innerHTML = `<i class="ri-user-3-line"></i> <span id="navLoginText">Login</span>`;
  }
  if (mobileText) {
    mobileText.textContent = 'Login';
  }
};

// Immediate cleanup and update on script load
try {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  if (!storedUser || storedUser.includes('undefined')) {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
} catch (e) {}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.updateAuthUI());
} else {
  window.updateAuthUI();
}
