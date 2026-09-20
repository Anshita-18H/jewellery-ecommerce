import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getWishlist,
  addToWishlistApi,
  removeFromWishlistApi,
  clearWishlistApi,
} from '../api';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Load wishlist from backend session on mount
  useEffect(() => {
    // Purge legacy client-side localStorage so old data does not interfere
    try {
      localStorage.removeItem('aura_wishlist');
    } catch {
      // Ignore
    }

    let isMounted = true;
    getWishlist()
      .then((items) => {
        if (isMounted) {
          setWishlistItems(Array.isArray(items) ? items : []);
        }
      })
      .catch((err) => {
        console.warn('Could not load session wishlist:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    async (product) => {
      if (!product || !product.id) return;

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

      // Optimistic update
      setWishlistItems((prev) => {
        if (prev.some((item) => String(item.id) === String(product.id))) return prev;
        return [cleanProduct, ...prev];
      });
      showToast('Added to your wishlist');

      try {
        await addToWishlistApi(product.id);
      } catch (err) {
        // Rollback on failure
        setWishlistItems((prev) => prev.filter((item) => String(item.id) !== String(product.id)));
        showToast(err.message || 'Could not update wishlist');
      }
    },
    [showToast]
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!productId) return;

      const previousItems = wishlistItems;
      // Optimistic update
      setWishlistItems((prev) => prev.filter((item) => String(item.id) !== String(productId)));
      showToast('Removed from your wishlist');

      try {
        await removeFromWishlistApi(productId);
      } catch (err) {
        // Rollback on failure
        setWishlistItems(previousItems);
        showToast(err.message || 'Could not remove from wishlist');
      }
    },
    [wishlistItems, showToast]
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

  const clearWishlist = useCallback(async () => {
    const previousItems = wishlistItems;
    setWishlistItems([]);

    try {
      await clearWishlistApi();
    } catch (err) {
      setWishlistItems(previousItems);
      showToast(err.message || 'Could not clear wishlist');
    }
  }, [wishlistItems, showToast]);

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
        loading,
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
