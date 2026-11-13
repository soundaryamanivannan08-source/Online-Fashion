# ÉLÉGANCE PARIS — Luxury Online Fashion Store

A responsive, high-fashion e-commerce home page built with pure **HTML5**, **CSS3**, and **Vanilla JavaScript** integrating the **DummyJSON Products API**.

---

## ✨ Features & Homepage Sections

### 1. Required Homepage Sections
- **Announcement Bar**: Global shipping banner with active promotional coupon alerts (`LUXE20`).
- **Header & Navigation**: Sticky blur header, luxury branding (*ÉLÉGANCE PARIS*), desktop navigation, live search bar, wishlist & cart counters, and mobile navigation drawer.
- **Hero Section**: Haute Couture editorial banner with seasonal Spring/Summer 2026 tags, bold typography, call-to-action buttons, client statistics, and floating luxury badges.
- **Trust Strip**: Highlights complimentary express shipping, guaranteed authenticity, 30-day luxury returns, and 24/7 concierge support.
- **Featured Categories**: Minimum 4 interactive categories (*Women's Dresses*, *Designer Handbags*, *Luxury Watches*, *Fragrances & Beauty*) with hover zoom and quick-filter integration.
- **New Arrivals**: Dynamic grid showcasing fresh runway pieces fetched from DummyJSON API with "New In" badges.
- **Trending Products**: Dynamic catalog with interactive category pills, live debounced search, sorting dropdown (price low/high, rating, name), and "Load More" pagination.
- **Best Sellers**: Dynamic showcase sorted by top customer ratings with "Bestseller" ribbon badges.
- **Special Offers**: 3 curated promotional cards:
  1. *Parisian Summer Couture Sale* with real-time countdown timer (Hours, Mins, Secs) and copyable coupon button.
  2. *Weekend Chic Accessories* (BOGO 50% perk).
  3. *VIP Club Maison Perfume* (Complimentary luxury gift).
- **Customer Testimonials**: 3 verified client reviews with 5-star ratings, avatars, and quotes.
- **Newsletter Subscription**: Interactive email capture form with validation and coupon code reward toast.
- **Footer**: Brand story, discover links, category links, Parisian address/contact information, payment provider icons (Visa, Mastercard, PayPal, Apple Pay), and copyright.

---

## 🛍️ Interactive JavaScript Functionalities

- **DummyJSON REST API Integration**:
  - Asynchronous data fetching using `async/await` and Fetch API.
  - Skeletons shimmer loaders during data fetch.
  - Graceful error handling with offline fallback luxury dataset and retry mechanism.
- **Slide-Over Shopping Bag Drawer**:
  - Add, remove, and modify product quantities.
  - Automatic calculations for subtotal, discount, shipping (free over $150), 5% tax, and grand total.
  - Free Shipping Progress Meter.
  - Coupon code redemption (`LUXE20`, `CHIC50`, `SAVE10`, `FREESHIP`).
- **Slide-Over Wishlist Drawer**:
  - Heart toggle on every product card.
  - Persistent state saved in `localStorage`.
  - One-click "Move to Bag" function.
- **Quick View Modal Popup**:
  - Multi-image gallery with interactive clickable thumbnail selector.
  - Detailed product information, live star ratings, reviews count, stock status, and return policy.
  - Quantity counter and direct "Add to Shopping Bag".
- **Checkout & Order Confirmation Flow**:
  - Shipping address and payment method form.
  - Saves completed order history to `localStorage` (`elegance_orders`).
  - Celebratory confetti burst on order completion.
  - Detailed receipt invoice with generated Order ID (e.g., `ELG-892134`).
- **Custom 404 Page**:
  - Elegant `404.html` with navigation links back to the store.
- **AOS Animations**: Smooth scroll-triggered entrance animations across all sections.

---

## 🎟️ Available Coupon Codes to Test

| Coupon Code | Discount / Benefit |
| :--- | :--- |
| **`LUXE20`** | 20% discount on order subtotal |
| **`CHIC50`** | 15% special discount on order subtotal |
| **`SAVE10`** | 10% discount on order subtotal |
| **`FREESHIP`** | 100% Free Shipping |

---

## 📁 Project Structure

```text
Online Fashion/
├── index.html          # Main Homepage
├── 404.html            # Custom 404 Error Page
├── README.md           # Documentation
├── css/
│   ├── styles.css      # Core luxury design system & component styles
│   └── responsive.css  # Tablet & mobile media queries
├── js/
│   ├── api.js          # DummyJSON API integration & fallback data
│   ├── cart.js         # Cart state, LocalStorage, coupons & totals
│   ├── wishlist.js     # Wishlist state, LocalStorage & heart toggles
│   ├── modal.js        # Quick view, checkout flow, confetti & toasts
│   └── main.js         # App bootstrap, search, filters, sorting & timers
└── assets/             # Directory for local media assets
```

---

## 🚀 How to Run

No build step or Node.js server required! Simply open [index.html](file:///c:/Users/Logesh/Documents/Online%20Fashion/index.html) in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
