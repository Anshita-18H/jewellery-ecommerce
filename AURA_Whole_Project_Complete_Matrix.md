# AURA Jewellery E-Commerce - Whole Project Complete Matrix

## 1. Customer Storefront & Shopping Experience
- **Hero Slider with Carousel Controls**: Auto-rotating promotional banner in Hero.jsx with slide indicators, touch support, and luxury jewellery call-to-actions.
- **Tanishq-Style AURA Assurance Section**: Two-column trust showcase in AssuranceSection.jsx highlighting 100% Certified Jewellery, Insured Express Shipping, and 30-Day Easy Returns.
- **Multi-Faceted Product Filter (Shop.jsx)**: Simultaneous multi-parameter filtering by Category, Occasion, Gender, Search Keywords, and dynamic Min/Max Price range sliders.
- **Product Detail & Interactive Rating (ProductDetail.jsx)**: High-resolution image gallery, real-time stock availability, customer reviews with StarRating.jsx, and related recommendations.
- **Cart Management & Subtotal Engine (Cart.jsx)**: Live quantity increment/decrement, item removal, instant subtotal calculation, free shipping threshold computation, and promotional discounts.
- **Persistent Customer Wishlist (Wishlist.jsx)**: Heart-icon toggling on product cards, localStorage persistence for guest visitors, database sync for members, and 'Move to Cart' functionality.

## 2. Checkout & Razorpay Payment Widget
- **Delivery Address Validation (Checkout.jsx)**: Customer name, formatted 10-digit telephone (+91), street address, city, and pincode collection.
- **Razorpay Standard Checkout Modal (Payment.jsx)**: Authentic phone-width centered modal (#1859F1 header, AURA Verified Business badge, Total Amount display, and dark backdrop overlay).
- **Two-Step Checkout Flow**: Step 1: Contact Details mobile confirmation -> Step 2: All Payment Options accordion list.
- **Accordion Payment Methods**: Interactive accordion supporting UPI (VPA handles), Credit/Debit Cards, Netbanking (SBI, ICICI, Kotak, Axis, BOB), EMI options, Digital Wallets, and Pay Later.
- **Atomic Order Placement**: Submits delivery details via POST /api/orders, triggers database transaction, decrements stock, and presents instant order receipt confirmation.

## 3. Administration & Business Operations
- **Protected Admin Authentication**: Dedicated login portal (AdminLogin.jsx) with separate admin session and route protection via ProtectedAdminRoute.jsx.
- **Sales & Operations Dashboard (Admin.jsx)**: Aggregated metrics displaying total revenue, completed orders count, registered customers, and low stock inventory alerts.
- **Product Catalog CRUD**: Add new jewellery products with images, price, categories, occasion tags, and stock counts; update or archive existing items.
- **Order Lifecycle Management**: View customer orders and transition statuses in real-time: Pending -> Processing -> Shipped -> Delivered.

## 4. Master Architectural Capabilities Matrix

| Functional Area | Underlying Tech & Files | Core Capability & Description |
|---|---|---|
| Authentication & Security | `JWT, bcryptjs, AuthContext.jsx` | Secure salted hashing, token expiration, guest-to-member cart migration |
| Database Integrity | `MySQL2 Pool, ACID Transactions` | Atomic order commits, connection pooling, prepared statements preventing SQLi |
| Product Discovery | `Shop.jsx, routes/products.js` | Server-side and client-side compound filtering (price, category, occasion) |
| Checkout & Payment | `Payment.jsx (Razorpay widget)` | Authentic 2-step Razorpay checkout modal with accordion payment options |
| Storefront Branding | `index.css, Lucide Icons` | Luxury dark theme (--gold, --cream, --bg-card) with responsive mobile layouts |
| Admin Operations | `Admin.jsx, routes/admin.js` | Full product catalog management, order fulfillment tracking, and KPI analytics |
