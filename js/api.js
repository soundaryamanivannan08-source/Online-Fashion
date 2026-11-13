/**
 * ==========================================================================
 * ÉLÉGANCE PARIS - API SERVICE
 * Connects to DummyJSON Products API with Async/Await, Error Handling & Fallbacks
 * ==========================================================================
 */

const API_CONFIG = {
  BASE_URL: 'https://dummyjson.com/products',
  FASHION_CATEGORIES: [
    'womens-dresses',
    'womens-shoes',
    'womens-bags',
    'womens-jewellery',
    'womens-watches',
    'mens-shirts',
    'mens-shoes',
    'mens-watches',
    'sunglasses',
    'beauty',
    'fragrances',
    'tops'
  ]
};

// In-memory cache for fast filtering and state management
let cachedProducts = [];

/**
 * Fetch initial fashion products from DummyJSON
 * Returns at least 25+ products
 */
const NON_FASHION_CATEGORIES = [
  'groceries',
  'furniture',
  'kitchen-accessories',
  'motorcycle',
  'vehicle',
  'smartphones',
  'laptops',
  'tablets',
  'mobile-accessories'
];

async function fetchProducts(limit = 100, skip = 0) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}?limit=${limit}&skip=${skip}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const raw = data.products || [];
    
    // Strictly filter out non-fashion categories like groceries and furniture
    const fashionItems = raw.filter(p => !NON_FASHION_CATEGORIES.includes((p.category || '').toLowerCase()));

    cachedProducts = fashionItems.length >= 12 ? fashionItems : [...fashionItems, ...getFallbackProducts()];
    return cachedProducts;
  } catch (error) {
    console.error('API Error in fetchProducts:', error);
    // Return sample fallback fashion products if offline or API blocked
    return getFallbackProducts();
  }
}

/**
 * Fetch a single product by ID
 */
async function fetchProductById(id) {
  try {
    // Check in cache first
    const cached = cachedProducts.find(p => p.id === Number(id));
    if (cached) return cached;

    const response = await fetch(`${API_CONFIG.BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error(`Product #${id} not found`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error in fetchProductById(${id}):`, error);
    return cachedProducts.find(p => p.id === Number(id)) || null;
  }
}

/**
 * Search products by keyword
 */
async function searchProductsAPI(query) {
  try {
    const trimmed = query.trim();
    if (!trimmed) return cachedProducts;

    const response = await fetch(`${API_CONFIG.BASE_URL}/search?q=${encodeURIComponent(trimmed)}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.warn('API Search failed, using client-side fallback:', error);
    const q = query.toLowerCase();
    return cachedProducts.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }
}

/**
 * Fetch products by category slug
 */
async function fetchProductsByCategory(categorySlug) {
  try {
    if (!categorySlug || categorySlug === 'all') {
      return cachedProducts.length > 0 ? cachedProducts : await fetchProducts(40);
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/category/${categorySlug}`);
    if (!response.ok) {
      throw new Error(`Category ${categorySlug} fetch failed`);
    }
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.warn(`Category ${categorySlug} fetch error, fallback to filter:`, error);
    return cachedProducts.filter(p => p.category.toLowerCase() === categorySlug.toLowerCase());
  }
}

/**
 * High-quality fallback dataset in case network fails
 */
function getFallbackProducts() {
  return [
    {
      id: 101,
      title: "Silk Evening Gown with Slit",
      description: "Luxurious handcrafted Mulberry silk evening gown with an elegant side slit and subtle shimmering drape. Perfect for galas and red-carpet events.",
      price: 189.99,
      discountPercentage: 15.5,
      rating: 4.88,
      stock: 14,
      category: "womens-dresses",
      brand: "Maison Royale",
      images: [
        "assets/category-dresses.webp"
      ],
      thumbnail: "assets/category-dresses.webp"
    },
    {
      id: 102,
      title: "Handmade Italian Leather Handbag",
      description: "Artisanal top-grain calfskin leather bag with brushed gold-toned hardware, detachable shoulder strap and velvet interior lining.",
      price: 249.50,
      discountPercentage: 20.0,
      rating: 4.95,
      stock: 8,
      category: "womens-bags",
      brand: "Milano Pelle",
      images: [
        "assets/category-bags.webp"
      ],
      thumbnail: "assets/category-bags.webp"
    },
    {
      id: 103,
      title: "Tailored Slim Fit Oxford Blazer",
      description: "Refined navy wool-blend tailored blazer with mother-of-pearl buttons, notch lapels and breathable interior cupro lining.",
      price: 165.00,
      discountPercentage: 12.0,
      rating: 4.79,
      stock: 22,
      category: "mens-shirts",
      brand: "Savile Row Co.",
      images: [
        "assets/product-suit.webp"
      ],
      thumbnail: "assets/product-suit.webp"
    },
    {
      id: 104,
      title: "Rose Gold Chronograph Watch",
      description: "Swiss automatic movement enclosed in 18k rose gold plated stainless steel, sapphire crystal dial and genuine leather strap.",
      price: 299.00,
      discountPercentage: 25.0,
      rating: 4.92,
      stock: 5,
      category: "womens-watches",
      brand: "Geneva Horizon",
      images: [
        "assets/category-watches.webp"
      ],
      thumbnail: "assets/category-watches.webp"
    },
    {
      id: 105,
      title: "Velvet Matte Signature Eau De Parfum",
      description: "A captivating fragrance featuring notes of French black truffle, bergamot, dark plum, orchid, and amber patchouli.",
      price: 85.00,
      discountPercentage: 10.0,
      rating: 4.85,
      stock: 35,
      category: "fragrances",
      brand: "L'Aura Parfum",
      images: [
        "assets/category-fragrances.webp"
      ],
      thumbnail: "assets/category-fragrances.webp"
    }
  ];
}
