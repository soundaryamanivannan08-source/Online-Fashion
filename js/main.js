/**
 * ==========================================================================
 * ÉLÉGANCE PARIS - MAIN APPLICATION CONTROLLER
 * Orchestrates API data, UI rendering, filtering, sorting, and animations
 * ==========================================================================
 */

let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentSort = 'default';
let visibleProductCount = 8;
const PRODUCTS_PER_PAGE = 8;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize State & UI
  window.cart.render();
  window.wishlist.render();
  initHeaderScroll();
  initCountdownTimer();
  initNewsletterForm();
  initCouponCopyListeners();

  // 2. Fetch API Products
  await loadHomepageProducts();

  // 3. Initialize AOS (Animate on Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60
    });
  }
});

/**
 * Load products from DummyJSON and render all sections
 */
async function loadHomepageProducts() {
  renderSkeletons('newArrivalsGrid', 8);

  try {
    const products = await fetchProducts(100);
    allProducts = products;
    filteredProducts = [...allProducts];

    // Render New Arrivals
    renderNewArrivals();

    // Sync wishlist heart states
    window.wishlist.syncCardButtons();
  } catch (error) {
    console.error('Failed to load products:', error);
    showErrorState('trendingProductsGrid');
  }
}

/**
 * Render Skeleton Loading Placeholders
 */
function renderSkeletons(containerId, count = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = Array.from({ length: count }).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-thumb"></div>
      <div class="skeleton-body">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line full"></div>
        <div class="skeleton-line medium"></div>
      </div>
    </div>
  `).join('');
}

/**
 * Display Error State with Retry Button
 */
function showErrorState(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px;">
      <i class="ri-wifi-off-line" style="font-size: 3rem; color: var(--danger); margin-bottom: 12px; display: inline-block;"></i>
      <h3 style="font-size: 1.3rem; margin-bottom: 8px;">Unable to Connect to Product Server</h3>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Please check your internet connection or try again.</p>
      <button class="btn btn-primary" onclick="loadHomepageProducts()">
        <i class="ri-restart-line"></i> Retry Loading
      </button>
    </div>
  `;
}

/**
 * Render New Arrivals Section (Latest high-rated items)
 */
function renderNewArrivals() {
  const container = document.getElementById('newArrivalsGrid');
  if (!container) return;

  // Take 8 curated fashion products
  const newArrivals = allProducts.slice(0, 8);
  container.innerHTML = newArrivals.map(product => createProductCardHtml(product, 'NEW')).join('');
}

/**
 * Render Best Sellers Section (Products sorted by highest rating)
 */
function renderBestSellers() {
  const container = document.getElementById('bestSellersGrid');
  if (!container) return;

  const bestSellers = [...allProducts]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);

  container.innerHTML = bestSellers.map(product => createProductCardHtml(product, 'BESTSELLER')).join('');
}

/**
 * Render Main Trending Products Section with Category & Sort filtering
 */
function renderTrendingProducts() {
  const container = document.getElementById('trendingProductsGrid');
  const countDisplay = document.getElementById('productsCountDisplay');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!container) return;

  let list = [...filteredProducts];

  // Apply Sorting
  if (currentSort === 'price-low') {
    list.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-high') {
    list.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'rating') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (currentSort === 'name') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Handle Empty State
  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <i class="ri-search-line" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 12px; display: inline-block;"></i>
        <h3 style="font-size: 1.4rem; margin-bottom: 8px;">No Fashion Pieces Found</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">We couldn't find any items matching your selected criteria.</p>
        <button class="btn btn-primary" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    if (countDisplay) countDisplay.textContent = 'Showing 0 products';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    return;
  }

  // Pagination slice
  const visibleList = list.slice(0, visibleProductCount);
  container.innerHTML = visibleList.map(product => createProductCardHtml(product)).join('');

  if (countDisplay) {
    countDisplay.textContent = `Showing ${visibleList.length} of ${list.length} luxury products`;
  }

  if (loadMoreBtn) {
    loadMoreBtn.style.display = visibleProductCount >= list.length ? 'none' : 'inline-flex';
  }

  // Refresh wishlist heart states on newly rendered cards
  window.wishlist.syncCardButtons();
}

/**
 * Generate HTML string for an individual Product Card
 */
function createProductCardHtml(product, specialBadge = null) {
  const isWishlisted = window.wishlist.isWishlisted(product.id);
  const oldPrice = product.discountPercentage 
    ? (product.price / (1 - (product.discountPercentage / 100))).toFixed(2) 
    : (product.price * 1.25).toFixed(2);

  const imageSrc = product.thumbnail || (product.images && product.images[0]) || 'https://placehold.co/300x300?text=Fashion';

  return `
    <div class="product-card" data-aos="fade-up" data-category="${product.category}">
      <div class="product-thumb-box" onclick="window.location.href='404.html'">
        <!-- Badges -->
        <div class="product-badges">
          ${specialBadge === 'NEW' ? '<span class="badge badge-new">New In</span>' : ''}
          ${specialBadge === 'BESTSELLER' ? '<span class="badge badge-bestseller">Bestseller</span>' : ''}
          ${product.discountPercentage > 10 ? `<span class="badge badge-discount">-${Math.round(product.discountPercentage)}%</span>` : ''}
        </div>

        <!-- Quick Action Floating Buttons -->
        <div class="card-actions" onclick="event.stopPropagation()">
          <button class="card-action-btn btn-wishlist-toggle ${isWishlisted ? 'active-wishlist' : ''}" 
                  data-id="${product.id}" 
                  onclick="window.location.href='404.html'" 
                  title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
            <i class="${isWishlisted ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
          </button>
          <button class="card-action-btn" onclick="window.location.href='404.html'" title="Quick Preview">
            <i class="ri-eye-line"></i>
          </button>
        </div>

        <img src="${imageSrc}" alt="${product.title}" loading="lazy" onerror="this.src='https://placehold.co/300x300?text=Fashion'">
        
        <button class="btn-quick-add" onclick="event.stopPropagation(); window.location.href='404.html'">
          <i class="ri-shopping-bag-line"></i> Quick Add to Bag
        </button>
      </div>

      <div class="product-info">
        <span class="product-category">${(product.category || 'Apparel').replace('-', ' ')}</span>
        <h3 class="product-title" onclick="window.location.href='404.html'">${product.title}</h3>
        
        <div class="product-rating">
          <div>${renderStars(product.rating)}</div>
          <span class="rating-count">(${product.rating ? Number(product.rating).toFixed(1) : '4.8'})</span>
        </div>

        <div class="product-price-box">
          <span class="current-price">$${Number(product.price).toFixed(2)}</span>
          <span class="old-price">$${oldPrice}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Quick Add to Cart from Card button
 */
window.quickAddToCart = function(productId) {
  window.location.href = '404.html';
};

/**
 * Toggle Wishlist from Card button
 */
window.toggleWishlistFromCard = function(productId) {
  window.location.href = '404.html';
};

/**
 * Category Filter Handler
 */
window.filterByCategory = function(categorySlug, buttonEl) {
  currentCategory = categorySlug;
  visibleProductCount = PRODUCTS_PER_PAGE;

  // Update active button state
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (buttonEl) buttonEl.classList.add('active');

  if (categorySlug === 'all') {
    filteredProducts = [...allProducts];
  } else {
    filteredProducts = allProducts.filter(p => 
      p.category && p.category.toLowerCase().includes(categorySlug.toLowerCase())
    );
  }

  renderTrendingProducts();
};

/**
 * Filter from Category Card clicks
 */
window.selectCategoryFromHero = function(categorySlug) {
  window.location.href = '404.html';
};

/**
 * Sort Handler
 */
window.handleSortChange = function(sortValue) {
  currentSort = sortValue;
  renderTrendingProducts();
};

/**
 * Live Search Handler with debounce
 */
let searchDebounceTimer = null;
window.handleSearchInput = function(query) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(async () => {
    const q = query.trim().toLowerCase();
    visibleProductCount = PRODUCTS_PER_PAGE;

    if (!q) {
      filteredProducts = currentCategory === 'all' 
        ? [...allProducts] 
        : allProducts.filter(p => p.category.toLowerCase().includes(currentCategory.toLowerCase()));
      renderTrendingProducts();
      return;
    }

    // Scroll to catalog section if user is searching
    const catalogSection = document.getElementById('catalogSection');
    if (catalogSection && window.scrollY < 300) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Perform search
    filteredProducts = allProducts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );

    renderTrendingProducts();
  }, 250);
};

/**
 * Load More Button
 */
window.loadMoreProducts = function() {
  visibleProductCount += PRODUCTS_PER_PAGE;
  renderTrendingProducts();
};

/**
 * Reset all active filters
 */
window.resetFilters = function() {
  currentCategory = 'all';
  currentSort = 'default';
  visibleProductCount = PRODUCTS_PER_PAGE;

  const searchInput = document.getElementById('catalogSearchInput') || document.getElementById('headerSearchInput');
  if (searchInput) searchInput.value = '';

  const sortSelect = document.getElementById('productSortSelect');
  if (sortSelect) sortSelect.value = 'default';

  const allBtn = document.querySelector('.filter-btn[data-category="all"]');
  filterByCategory('all', allBtn);
};

/**
 * Sticky Header Scroll Observer
 */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/**
 * Real-time Flash Sale Countdown Timer
 */
function initCountdownTimer() {
  // Set countdown 24 hours from current session
  const targetTime = new Date().getTime() + (18 * 60 * 60 * 1000) + (45 * 60 * 1000);

  function update() {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance <= 0) {
      return;
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const hEl = document.getElementById('timerHours');
    const mEl = document.getElementById('timerMinutes');
    const sEl = document.getElementById('timerSeconds');

    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
    if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

/**
 * Newsletter Form Submit with Validation & 404 Redirection
 */
function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      window.showToast('Please enter a valid email address.', 'error');
      if (emailInput) emailInput.focus();
      return;
    }

    window.showToast('Thank you! VIP subscription verified. Redirecting...', 'success');
    if (emailInput) emailInput.value = '';
    setTimeout(() => {
      window.location.href = '404.html';
    }, 800);
  });
}

/**
 * Click-to-copy Promo Coupon codes & 404 Redirection
 */
function initCouponCopyListeners() {
  document.querySelectorAll('.copy-coupon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-coupon');
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          window.showToast(`Copied coupon code "${code}"! Redirecting...`, 'success');
        }).catch(() => {
          window.showToast(`Coupon "${code}" activated! Redirecting...`, 'success');
        }).finally(() => {
          setTimeout(() => {
            window.location.href = '404.html';
          }, 700);
        });
      } else {
        window.location.href = '404.html';
      }
    });
  });
}

/**
 * Global 404 Redirection Interceptor
 * Redirects all links & buttons across the site to 404.html,
 * strictly EXCEPT navlinks (header and mobile drawer) and footer links.
 */
document.addEventListener('click', (event) => {
  const target = event.target.closest('a, button, .category-card');
  if (!target) return;

  // 1. Exclude Header Navlinks and Brand Logo
  if (target.closest('.site-header')) return;

  // 2. Exclude Mobile Navigation Drawer Links
  if (target.closest('.mobile-nav-drawer')) return;

  // 3. Exclude Footer Links & Socials
  if (target.closest('.site-footer')) return;

  // 4. Exclude Drawer & Modal close buttons
  if (target.classList.contains('drawer-close') || target.classList.contains('modal-close')) return;

  // 5. Exclude Form Submit Buttons (so form validation runs first)
  if (target.type === 'submit') return;

  // 6. Exclude Auth Modal tab switchers (Sign In / Register tabs)
  if (target.classList.contains('auth-tab')) return;

  // 7. For all other in-page links and buttons, redirect to 404.html
  event.preventDefault();
  window.location.href = '404.html';
}, true);

