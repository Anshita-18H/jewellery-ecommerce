const BASE_URL = 'http://localhost:5000/api';

// `credentials: 'include'` is required so the session cookie
// (used for the cart) is sent and stored by the browser.
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
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
export const getProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/products${query ? `?${query}` : ''}`);
};
export const getProduct = (slug) => request(`/products/${slug}`);
export const createProduct = (data) => request('/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });

// ---- Categories ----
export const getCategories = () => request('/categories');

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