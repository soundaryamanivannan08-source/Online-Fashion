/**
 * ==========================================================================
 * ÉLÉGANCE PARIS - WISHLIST MODULE
 * Manages wishlist state, LocalStorage persistence, drawer, and heart toggles
 * ==========================================================================
 */

const WISHLIST_STORAGE_KEY = 'elegance_wishlist';

class WishlistManager {
  constructor() {
    this.items = this.loadWishlist();
  }

  loadWishlist() {
    try {
      const data = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading wishlist:', e);
      return [];
    }
  }

  saveWishlist() {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.error('Error saving wishlist:', e);
    }
  }

  isWishlisted(productId) {
    return this.items.some(item => item.id === Number(productId));
  }

  toggle(product) {
    const pId = Number(product.id);
    const index = this.items.findIndex(item => item.id === pId);

    if (index > -1) {
      this.items.splice(index, 1);
      if (window.showToast) {
        window.showToast(`Removed from wishlist`, 'info');
      }
    } else {
      this.items.push({
        id: pId,
        title: product.title,
        price: Number(product.price),
        image: product.thumbnail || (product.images && product.images[0]) || '',
        category: product.category
      });
      if (window.showToast) {
        window.showToast(`Saved to your wishlist!`, 'success');
      }
      this.animateBadge();
    }

    this.saveWishlist();
    this.render();
    this.syncCardButtons();
  }

  removeItem(productId) {
    const pId = Number(productId);
    this.items = this.items.filter(item => item.id !== pId);
    this.saveWishlist();
    this.render();
    this.syncCardButtons();
    if (window.showToast) {
      window.showToast(`Item removed from wishlist`, 'info');
    }
  }

  moveToCart(productId) {
    const item = this.items.find(i => i.id === Number(productId));
    if (item && window.cart) {
      window.cart.addItem(item, 1);
      this.removeItem(productId);
      if (window.showToast) {
        window.showToast(`Moved to shopping bag!`, 'success');
      }
    }
  }

  animateBadge() {
    const badges = document.querySelectorAll('.wishlist-badge');
    badges.forEach(badge => {
      badge.classList.add('pop');
      setTimeout(() => badge.classList.remove('pop'), 300);
    });
  }

  syncCardButtons() {
    const buttons = document.querySelectorAll('.btn-wishlist-toggle');
    buttons.forEach(btn => {
      const id = Number(btn.getAttribute('data-id'));
      if (this.isWishlisted(id)) {
        btn.classList.add('active-wishlist');
        btn.innerHTML = '<i class="ri-heart-fill"></i>';
      } else {
        btn.classList.remove('active-wishlist');
        btn.innerHTML = '<i class="ri-heart-line"></i>';
      }
    });
  }

  render() {
    const count = this.items.length;

    // 1. Update Wishlist Badges
    const badges = document.querySelectorAll('.wishlist-badge');
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });

    // 2. Render List in Drawer
    const itemsContainer = document.getElementById('wishlistItemsList');
    const emptyState = document.getElementById('wishlistEmptyState');

    if (!itemsContainer) return;

    if (count === 0) {
      itemsContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    itemsContainer.innerHTML = this.items.map(item => `
      <div class="drawer-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.title}" class="drawer-item-img" onerror="this.src='https://placehold.co/80x80?text=Fashion'">
        <div class="drawer-item-info">
          <div>
            <h4 class="drawer-item-title">${item.title}</h4>
            <span class="drawer-item-meta">$${item.price.toFixed(2)}</span>
          </div>
          <div class="drawer-item-actions">
            <button class="btn btn-sm btn-primary" onclick="window.wishlist.moveToCart(${item.id})">
              <i class="ri-shopping-bag-line"></i> Move to Bag
            </button>
            <button class="btn-remove-item" onclick="window.wishlist.removeItem(${item.id})" title="Remove">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// Global wishlist instance
window.wishlist = new WishlistManager();
