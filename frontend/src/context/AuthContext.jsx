import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, loginUser, signupUser, registerUser, logoutUser } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth modal state for gated interactions (e.g. wishlist)
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    initialMode: 'login', // 'login' | 'signup'
    prompt: '',
    onSuccess: null,
  });

  // Check current session on initial page load
  const checkAuth = useCallback(async () => {
    try {
      const data = await getMe();
      if (data && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const openAuthModal = useCallback(({ mode = 'login', prompt = '', onSuccess = null } = {}) => {
    setAuthModal({
      isOpen: true,
      initialMode: mode,
      prompt,
      onSuccess,
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, isOpen: false, onSuccess: null }));
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    if (data && data.user) {
      setUser(data.user);
      if (authModal.onSuccess) {
        try {
          authModal.onSuccess(data.user);
        } catch (e) {
          console.error('onSuccess callback error:', e);
        }
      }
    }
    return data;
  };

  const signup = async (formData) => {
    const data = await signupUser(formData);
    if (data && data.user) {
      setUser(data.user);
      if (authModal.onSuccess) {
        try {
          authModal.onSuccess(data.user);
        } catch (e) {
          console.error('onSuccess callback error:', e);
        }
      }
    }
    return data;
  };

  const register = async (formData) => {
    return signup(formData);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        register,
        logout,
        refreshUser: checkAuth,
        authModal,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
