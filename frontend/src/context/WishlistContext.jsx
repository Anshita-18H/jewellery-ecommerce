import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext(null);

const STORAGE_KEY = 'aura_wishlist';

function getStoredWishlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Validate each item has at least an id and name
      return parsed.filter((item) => item && typeof item === 'object' && item.id !== undefined);
    }
    return [];
  } catch (err) {
    console.warn('Failed to parse wishlist from localStorage. Resetting to empty array.', err);
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState(getStoredWishlist);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch (err) {
      console.warn('Unable to persist wishlist to localStorage:', err);
    }
  }, [wishlistItems]);

  // Toast timer cleanup
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
  }, []);

  const isInWishlist = useCallback(
    (productId) => {
      if (!productId) return false;
      return wishlistItems.some((item) => String(item.id) === String(productId));
    },
    [wishlistItems]
  );

  const addToWishlist = useCallback(
    (product) => {
      if (!product || !product.id) return;
      setWishlistItems((prev) => {
        const exists = prev.some((item) => String(item.id) === String(product.id));
        if (exists) return prev; // Deduplicate

        // Sanitize product object to only store required display attributes
        const cleanProduct = {
          id: product.id,
          name: product.name || 'Fine Jewellery Piece',
          slug: product.slug || String(product.id),
          price: product.price || 0,
          image_url: product.image_url || '',
          category_name: product.category_name || '',
          stock: typeof product.stock === 'number' ? product.stock : 1,
          description: product.description || '',
        };

        return [...prev, cleanProduct];
      });
      showToast('Added to your wishlist');
    },
    [showToast]
  );

  const removeFromWishlist = useCallback(
    (productId) => {
      if (!productId) return;
      setWishlistItems((prev) => prev.filter((item) => String(item.id) !== String(productId)));
      showToast('Removed from your wishlist');
    },
    [showToast]
  );

  const toggleWishlist = useCallback(
    (product) => {
      if (!product || !product.id) return;
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product);
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <div className="aura-toast" role="status" aria-live="polite">
          <span className="aura-toast-dot" />
          <span>{toastMessage}</span>
        </div>
      )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

