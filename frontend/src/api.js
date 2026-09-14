const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

// `credentials: 'include'` is required so the session cookie
// (used for cart and auth) is sent and stored by the browser.
async function request(path, options = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// ---- Products ----
export const getProducts = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const data = await request(`/products${query ? `?${query}` : ''}`);
  return Array.isArray(data) ? data : data?.products || [];
};
export const getProduct = (slug) => request(`/products/${slug}`);
export const createProduct = (data) => request('/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });
export const restoreProduct = (id) => request(`/products/${id}/restore`, { method: 'PUT' });
export const hardDeleteProduct = (id) => request(`/products/${id}/permanent`, { method: 'DELETE' });

// ---- Categories ----
export const getCategories = async () => {
  const data = await request('/categories');
  return Array.isArray(data) ? data : data?.categories || [];
};

// ---- Cart ----
export const getCart = () => request('/cart');
export const addToCart = (product_id, quantity = 1) =>
  request('/cart', { method: 'POST', body: JSON.stringify({ product_id, quantity }) });
export const updateCartItem = (productId, quantity) =>
  request(`/cart/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
export const removeCartItem = (productId) => request(`/cart/${productId}`, { method: 'DELETE' });

// ---- Orders ----
export const placeOrder = (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) });
export const getOrders = () => request('/orders');
export const getOrder = (id) => request(`/orders/${id}`);
export const updateOrderStatus = (id, status) =>
  request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

// ---- Authentication (Session Cookie) ----
export const registerUser = (data) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const loginUser = (data) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const getMe = () => request('/auth/me');
export const logoutUser = () => request('/auth/logout', { method: 'POST' });

// ---- Product Ratings & Reviews ----
export const getProductRatings = (productId) =>
  request(`/products/${productId}/ratings`);
export const getMyRating = (productId) =>
  request(`/products/${productId}/ratings/my-rating`);
export const submitProductRating = (productId, data) =>
  request(`/products/${productId}/ratings`, { method: 'POST', body: JSON.stringify(data) });
export const deleteProductRating = (productId) =>
  request(`/products/${productId}/ratings`, { method: 'DELETE' });

// ---- Admin Authentication (Session Cookie + Role Check) ----
export const adminLogin = (data) =>
  request('/auth/admin/login', { method: 'POST', body: JSON.stringify(data) });
export const getAdminMe = () => request('/auth/admin/me');
export const adminLogout = () => request('/auth/admin/logout', { method: 'POST' });

// ---- Admin Management & Analytics ----
export const getAdminDashboard = () => request('/admin/dashboard');
export const getAdminReviews = () => request('/admin/reviews');
export const deleteAdminReview = (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' });
export const getAdminCustomers = () => request('/admin/customers');