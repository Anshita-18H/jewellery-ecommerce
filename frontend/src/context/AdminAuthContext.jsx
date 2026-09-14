import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAdminMe, adminLogin as apiAdminLogin, adminLogout as apiAdminLogout } from '../api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);

  // Check active administrator session on mount
  const checkAdminAuth = useCallback(async () => {
    try {
      const data = await getAdminMe();
      if (data && data.admin && data.admin.role === 'admin') {
        setAdminUser(data.admin);
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  const login = async (credentials) => {
    const data = await apiAdminLogin(credentials);
    if (data && data.admin) {
      setAdminUser(data.admin);
    }
    return data;
  };

  const logout = async () => {
    try {
      await apiAdminLogout();
    } finally {
      setAdminUser(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        adminLoading,
        adminLogin: login,
        adminLogout: logout,
        checkAdminAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

