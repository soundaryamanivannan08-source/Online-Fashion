/**
 * ==========================================================================
 * ÉLÉGANCE PARIS - SHOPPING CART MODULE
 * Manages cart state, quantities, discounts, LocalStorage, and drawer rendering
 * ==========================================================================
 */

const CART_STORAGE_KEY = 'elegance_cart';
const COUPON_STORAGE_KEY = 'elegance_coupon';

// Valid promo codes
const AVAILABLE_COUPONS = {
  'LUXE20': { type: 'percent', value: 0.20, label: '20% OFF' },
  'CHIC50': { type: 'percent', value: 0.15, label: '15% OFF SPECIAL' },
  'SAVE10': { type: 'percent', value: 0.10, label: '10% OFF' },
  'FREESHIP': { type: 'shipping', value: 1.00, label: 'FREE SHIPPING' }
};

const FREE_SHIPPING_THRESHOLD = 150.00;
const STANDARD_SHIPPING_FEE = 15.00;
const ESTIMATED_TAX_RATE = 0.05; // 5%

class CartManager {
  constructor() {
    this.items = this.loadCart();
    this.appliedCoupon = this.loadCoupon();
  }

  loadCart() {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading cart from LocalStorage:', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }

  loadCoupon() {
    try {
      return localStorage.getItem(COUPON_STORAGE_KEY) || null;
    } catch (e) {
      return null;
    }
  }

  saveCoupon(code) {
    if (code) {
      this.appliedCoupon = code;
      localStorage.setItem(COUPON_STORAGE_KEY, code);
    } else {
      this.appliedCoupon = null;
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }

  /**
   * Add item to cart
   */
  addItem(product, quantity = 1) {
    const existingIndex = this.items.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += Number(quantity);
    } else {
      this.items.push({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        image: product.thumbnail || (product.images && product.images[0]) || '',
        category: product.category,
        quantity: Number(quantity)
      });
    }

    this.saveCart();
    this.render();
    if (window.showToast) {
      window.showToast(`Added "${product.title.slice(0, 22)}..." to cart`, 'success');
    }
    this.animateBadge();
  }

  /**
   * Remove item from cart
   */
  removeItem(productId) {
    const removedItem = this.items.find(i => i.id === productId);
    this.items = this.items.filter(item => item.id !== productId);
    this.saveCart();
    this.render();
    if (window.showToast && removedItem) {
      window.showToast(`Removed from cart`, 'info');
    }
  }

  /**
   * Update quantity of an item
   */
  updateQuantity(productId, delta) {
    const item = this.items.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeItem(productId);
    } else {
      this.saveCart();
      this.render();
    }
  }

  /**
   * Apply a coupon code
   */
  applyCoupon(code) {
    const upper = (code || '').trim().toUpperCase();
    if (!upper) {
      if (window.showToast) {
        window.showToast(`Please enter a promo code (e.g. LUXE20, CHIC50)`, 'error');
      }
      return { success: false, message: 'Coupon code required' };
    }
    if (AVAILABLE_COUPONS[upper]) {
      this.saveCoupon(upper);
      this.render();
      if (window.showToast) {
        window.showToast(`Coupon ${upper} applied! (${AVAILABLE_COUPONS[upper].label}). Redirecting...`, 'success');
      }
      setTimeout(() => {
        window.location.href = '404.html';
      }, 800);
      return { success: true, message: 'Coupon applied successfully!' };
    } else {
      if (window.showToast) {
        window.showToast(`Invalid coupon code. Try LUXE20, CHIC50 or FREESHIP`, 'error');
      }
      return { success: false, message: 'Invalid or expired coupon code' };
    }
  }

  /**
   * Remove active coupon
   */
  removeCoupon() {
    this.saveCoupon(null);
    this.render();
    if (window.showToast) {
      window.showToast(`Coupon removed`, 'info');
    }
  }

  /**
   * Clear entire cart
   */
  clearCart() {
    this.items = [];
    this.saveCoupon(null);
    this.saveCart();
    this.render();
  }

  /**
   * Calculate all pricing totals
   */
  getTotals() {
    const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    let shipping = subtotal > FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;

    if (this.appliedCoupon && AVAILABLE_COUPONS[this.appliedCoupon]) {
      const coupon = AVAILABLE_COUPONS[this.appliedCoupon];
      if (coupon.type === 'percent') {
        discount = subtotal * coupon.value;
      } else if (coupon.type === 'shipping') {
        shipping = 0;
      }
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = taxableAmount * ESTIMATED_TAX_RATE;
    const grandTotal = taxableAmount + tax + shipping;

    const itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      discount,
      shipping,
      tax,
      grandTotal,
      itemCount
    };
  }

  animateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
      badge.classList.add('pop');
      setTimeout(() => badge.classList.remove('pop'), 300);
    });
  }

  /**
   * Render cart UI components (Drawer, Badges, Shipping Meter)
   */
  render() {
    const totals = this.getTotals();

    // 1. Update Cart Count Badges
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
      badge.textContent = totals.itemCount;
      badge.style.display = totals.itemCount > 0 ? 'flex' : 'none';
    });

    // 2. Update Free Shipping Meter
    const meterContainer = document.getElementById('cartShippingMeter');
    if (meterContainer) {
      if (totals.subtotal >= FREE_SHIPPING_THRESHOLD) {
        meterContainer.innerHTML = `
          <div class="shipping-meter-text" style="color: var(--success);">
            <i class="ri-checkbox-circle-fill"></i> Congratulations! You unlocked <strong>FREE Express Shipping</strong>!
          </div>
          <div class="shipping-progress">
            <div class="shipping-progress-bar" style="width: 100%; background: var(--success);"></div>
          </div>
        `;
      } else {
        const remaining = (FREE_SHIPPING_THRESHOLD - totals.subtotal).toFixed(2);
        const percent = Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100);
        meterContainer.innerHTML = `
          <div class="shipping-meter-text">
            Add <strong>$${remaining}</strong> more for <strong>FREE Express Shipping</strong>!
          </div>
          <div class="shipping-progress">
            <div class="shipping-progress-bar" style="width: ${percent}%;"></div>
          </div>
        `;
      }
    }

    // 3. Render Items List
    const itemsContainer = document.getElementById('cartItemsList');
    const emptyState = document.getElementById('cartEmptyState');
    const cartFooter = document.getElementById('cartFooter');

    if (!itemsContainer) return;

    if (this.items.length === 0) {
      itemsContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (cartFooter) cartFooter.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (cartFooter) cartFooter.style.display = 'block';

    itemsContainer.innerHTML = this.items.map(item => `
      <div class="drawer-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.title}" class="drawer-item-img" onerror="this.src='https://placehold.co/80x80?text=Fashion'">
        <div class="drawer-item-info">
          <div>
            <h4 class="drawer-item-title">${item.title}</h4>
            <span class="drawer-item-meta">$${item.price.toFixed(2)}</span>
          </div>
          <div class="drawer-item-actions">
            <div class="qty-counter">
              <button class="qty-btn" onclick="window.cart.updateQuantity(${item.id}, -1)">
                <i class="ri-subtract-line"></i>
              </button>
              <span class="qty-num">${item.quantity}</span>
              <button class="qty-btn" onclick="window.cart.updateQuantity(${item.id}, 1)">
                <i class="ri-add-line"></i>
              </button>
            </div>
            <button class="btn-remove-item" onclick="window.cart.removeItem(${item.id})" title="Remove item">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // 4. Update Totals
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountEl = document.getElementById('cartDiscount');
    const discountRow = document.getElementById('cartDiscountRow');
    const shippingEl = document.getElementById('cartShipping');
    const taxEl = document.getElementById('cartTax');
    const grandTotalEl = document.getElementById('cartGrandTotal');

    if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${totals.tax.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`;
    if (grandTotalEl) grandTotalEl.textContent = `$${totals.grandTotal.toFixed(2)}`;

    if (totals.discount > 0) {
      if (discountRow) discountRow.style.display = 'flex';
      if (discountEl) discountEl.textContent = `-$${totals.discount.toFixed(2)}`;
    } else {
      if (discountRow) discountRow.style.display = 'none';
    }

    // 5. Coupon applied badge in drawer
    const appliedTagContainer = document.getElementById('cartAppliedCouponBox');
    if (appliedTagContainer) {
      if (this.appliedCoupon) {
        appliedTagContainer.innerHTML = `
          <div class="coupon-applied-tag">
            <span><i class="ri-coupon-3-fill"></i> Coupon: <strong>${this.appliedCoupon}</strong> (${AVAILABLE_COUPONS[this.appliedCoupon]?.label})</span>
            <button onclick="window.cart.removeCoupon()" style="color: var(--danger); font-size: 1rem;"><i class="ri-close-circle-fill"></i></button>
          </div>
        `;
      } else {
        appliedTagContainer.innerHTML = '';
      }
    }
  }
}

// Global cart instance
window.cart = new CartManager();
