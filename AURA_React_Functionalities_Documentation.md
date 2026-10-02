# AURA React 19 Functionalities Documentation

## 1. React Core Hooks Matrix
- **`useState (19 files)`**: Local reactive state management powering forms, active modal states, accordion toggles in Razorpay payment, search filters, and loading indicators.
- **`useEffect (12 files)`**: Manages side effects: initial data fetching from API, URL query parameter synchronization, automatic hero carousel interval timers with cleanup, and localStorage synchronization.
- **`useCallback (6 files)`**: Memoizes functions to prevent unnecessary child re-renders (e.g. refreshCartCount in App.jsx, fetchProductDetail in ProductDetail.jsx, and authentication handlers).
- **`useRef (3 files)`**: Stores mutable references that persist without triggering re-renders (e.g. hero slide interval IDs in Hero.jsx, search input auto-focus in Navbar.jsx, and admin tab state).
- **`createContext (3 files)`**: Instantiates global shared context channels: AuthContext for customers, AdminAuthContext for dashboard security, and WishlistContext for saved items.
- **`useContext (3 files)`**: Consumes global state across deeply nested components without prop drilling.

## 2. React Router DOM (v7) Capabilities
- **`HashRouter`**: Client-side routing wrapper in main.jsx enabling seamless routing on static hosts without server-side rewrite issues.
- **`Routes & Route`**: Declarative routing engine in App.jsx defining paths for /shop, /cart, /checkout, /payment, /admin, etc.
- **`useNavigate`**: Imperative programmatic navigation (redirecting to /payment with state, navigating to /checkout after cart, or redirecting to /shop after order completion).
- **`useLocation`**: Accesses the current URL pathname and state payload passed between pages (e.g. location.state.deliveryDetails in Payment.jsx).
- **`useSearchParams`**: Two-way synchronization of URL search queries in Shop.jsx for category, occasion, gender, min_price, max_price, and search terms.
- **`useParams`**: Extracts dynamic URL route parameters (e.g. /product/:slug in ProductDetail.jsx).
- **`Link & NavLink`**: Accessible client-side link navigation preventing page refreshes and maintaining SPA state.
- **`Navigate`**: Declarative redirects in ProtectedAdminRoute.jsx redirecting unauthorized visitors to /admin-login.

## 3. Global State Architecture (Context API)
- **`AuthContext (AuthProvider)`**: Manages logged-in user credentials, JWT token persistence in localStorage, automatic session recovery on page reload, and login/register/logout actions.
- **`AdminAuthContext (AdminAuthProvider)`**: Isolated administrator authentication context managing separate admin tokens, RBAC roles, and protected route access.
- **`WishlistContext (WishlistProvider)`**: Manages user wishlist items, seamless local-storage fallback for guests, item toggling, and navbar badge count updates.

## 4. Component Patterns & Architecture

| React Pattern / Concept | Components Implementing Pattern | Architectural Benefit |
|---|---|---|
| `Controlled Form Inputs` | `Payment.jsx, Checkout.jsx, Login.jsx` | Single source of truth for form inputs with live validation & masking |
| `Compound Context Providers` | `App.jsx (AuthProvider, Admin, Wishlist)` | Clean dependency injection without prop-drilling down component trees |
| `Accordion Accordion-State` | `Payment.jsx (Razorpay checkout)` | Single active method expanded while others collapse automatically |
| `Dynamic Route Guards` | `ProtectedAdminRoute.jsx` | Restricts admin dashboard to authenticated administrators with role verification |
| `URL Query Synchronization` | `Shop.jsx (Price filter, category, search)` | Enables bookmarkable and shareable search/filter URLs |
| `Timer Cleanup Lifecycle` | `Hero.jsx (Carousel auto-rotate)` | Prevents memory leaks by clearing setInterval on component unmount |
| `Derived State Calculations` | `Cart.jsx, Payment.jsx` | Instant subtotal, tax, and EMI calculations without redundant state |
| `Synthetic Event Handling` | `Navbar.jsx, ProductCard.jsx, StarRating.jsx` | Consistent cross-browser event handling (e.preventDefault, stopPropagation) |
