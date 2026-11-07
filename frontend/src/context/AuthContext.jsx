import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AuthContext = createContext();

// Decode JWT payload without a library (base64url → JSON)
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

// Check whether a decoded JWT is still valid (not expired)
function isTokenValid(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return false;
  // exp is in seconds, Date.now() in ms
  return decoded.exp * 1000 > Date.now();
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true); // true while checking stored token

  // 🌙 Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  // 🔄 Smart Product Comparison items (up to 3)
  const [compareItems, setCompareItems] = useState([]);

  const addToCompare = useCallback((product) => {
    setCompareItems((prev) => {
      if (prev.find((p) => p._id === product._id)) return prev;
      if (prev.length >= 3) {
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId) => {
    setCompareItems((prev) => prev.filter((p) => p._id !== productId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
  }, []);

  // On mount: restore session from localStorage, but only if token is still valid
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser && isTokenValid(storedToken)) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else {
      // Clear stale/expired data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  // Refresh user profile from backend to sync fresh rewards, sizingProfile, styleQuiz
  const refreshUser = useCallback(async () => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) return;
    try {
      const res = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser((prev) => ({ ...prev, ...data.user }));
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } catch {}
  }, [token]);

  // Sync cart count with backend
  const refreshCartCount = useCallback(async () => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const valid = (data.cart || []).filter((i) => i && i.product && i.product._id);
        const count = valid.reduce((sum, i) => sum + (i.quantity || 1), 0);
        setCartCount(count);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    refreshCartCount();
    if (token) {
      refreshUser();
      // Auto-validate login streak
      fetch('/api/personal/check-streak', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.totalCoins !== undefined) {
            setUser((prev) => prev ? { ...prev, rewardCoins: data.totalCoins, dailyStreak: { count: data.streakCount } } : prev);
          }
        })
        .catch(() => {});
    }
  }, [token, refreshCartCount, refreshUser]);

  const login = useCallback((userData, tokenVal) => {
    setUser(userData);
    setToken(tokenVal);
    localStorage.setItem('token', tokenVal);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setCartCount(0);
    setCompareItems([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // Global fetch wrapper that auto-handles 401 (expired/invalid token)
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });

    // If the server says unauthorized, auto-logout
    if (res.status === 401) {
      logout();
      window.location.href = '/login';
      return res;
    }

    return res;
  }, [token, logout]);

  const value = useMemo(() => ({
    user,
    token,
    login,
    updateUser,
    logout,
    cartCount,
    setCartCount,
    refreshCartCount,
    refreshUser,
    authFetch,
    loading,
    darkMode,
    toggleDarkMode,
    compareItems,
    addToCompare,
    removeFromCompare,
    clearCompare,
  }), [
    user,
    token,
    login,
    updateUser,
    logout,
    cartCount,
    setCartCount,
    refreshCartCount,
    refreshUser,
    authFetch,
    loading,
    darkMode,
    toggleDarkMode,
    compareItems,
    addToCompare,
    removeFromCompare,
    clearCompare,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
