# AURA Node.js Backend Functions & API Documentation

## 1. Custom Developer-Defined Functions
- **`verifyToken(req, res, next)`**: Authentication middleware in backend/middleware/auth.js validating JWT/session bearer tokens for protected customer routes.
- **`verifyAdmin(req, res, next)`**: Role-based access guard in backend/middleware/auth.js ensuring req.user.role === 'admin' before accessing dashboard resources.
- **`generateOrderNumber()`**: Order number generation utility producing unique formatted reference codes e.g. ORD-TIMESTAMP-RANDOM.
- **`formatCurrency(val)`**: Financial formatting utility in utils/format.js formatting numbers into Indian Rupee denomination format.
- **`parseFilterParams(query)`**: Query string parser in routes/products.js extracting and validating min_price, max_price, category, occasion, and gender.
- **`hashPassword(plaintext)`**: Asynchronous bcryptjs hashing utility in routes/auth.js with standard salt rounds (10) for credential protection.
- **`comparePassword(entered, hash)`**: Bcryptjs password verification function during user and administrator sign-in.
- **`syncCartWithDb(userId, sessionCart)`**: Synchronization utility transferring guest cart items into the MySQL database upon customer sign-in.
- **`initDbPool()`**: Database pool initializer in backend/config/db.js creating resilient connection pool with keep-alive limits.

## 2. Express Framework Methods
- **`express()`**: Primary Application instantiation in backend/server.js mounting global middleware and routes.
- **`app.use(middleware)`**: Mounts global plugins: cors(), express.json(), express.urlencoded(), and express-session.
- **`express.Router()`**: Modular route handlers in backend/routes/ (auth, products, orders, cart, wishlist, admin, etc.).
- **`app.listen(PORT, cb)`**: Starts HTTP listener on configured environment port (default 5000).
- **`router.get / post / put / delete`**: HTTP verb method handlers bound across all 38 application endpoints.
- **`res.status(code).json(body)`**: Standardized JSON response dispatch with HTTP status codes (200, 201, 400, 401, 404, 500).

## 3. Database Functions & Transactions
- **`pool.query(sql, params)`**: Prepared SQL statement execution with connection reuse and SQL injection prevention.
- **`pool.getConnection()`**: Acquires a dedicated DB connection for atomic transactions.
- **`connection.beginTransaction()`**: Starts an ACID atomic transaction in routes/orders.js for checkout placement.
- **`connection.commit()`**: Permanently commits inventory deductions, order record, and order items upon success.
- **`connection.rollback()`**: Rolls back inventory changes and database writes if any checkout step fails.
- **`connection.release()`**: Safely returns the connection to the connection pool in the finally block.

## 4. API Endpoints Matrix

| HTTP Method & Path | Source File | Purpose & Operation |
|---|---|---|
| `POST /api/auth/register` | `routes/auth.js` | Create new customer with hashed password |
| `POST /api/auth/login` | `routes/auth.js` | Authenticate customer and issue session/token |
| `GET /api/products` | `routes/products.js` | List products with filters (price range, category, occasion) |
| `GET /api/products/:id` | `routes/products.js` | Fetch product detail by primary ID or slug |
| `POST /api/orders` | `routes/orders.js` | Atomic order creation with transaction & inventory decrement |
| `GET /api/orders` | `routes/orders.js` | Fetch order history for authenticated customer |
| `GET /api/cart` | `routes/cart.js` | Retrieve active cart items and compute total |
| `POST /api/cart/items` | `routes/cart.js` | Add item or increment quantity in customer cart |
| `DELETE /api/cart/items/:id` | `routes/cart.js` | Remove item from cart and recalculate subtotal |
| `GET /api/wishlist` | `routes/wishlist.js` | Fetch all wishlist items for current user |
| `POST /api/wishlist/toggle` | `routes/wishlist.js` | Toggle item in/out of customer wishlist |
| `POST /api/admin/login` | `routes/admin.js` | Authenticate admin credentials and issue admin session |
| `GET /api/admin/metrics` | `routes/admin.js` | Retrieve aggregated sales, total orders, and stock alerts |
| `POST /api/admin/products` | `routes/admin.js` | Create new jewellery catalog product |
| `PUT /api/admin/orders/:id` | `routes/admin.js` | Update order status: Pending, Processing, Shipped, Delivered |
