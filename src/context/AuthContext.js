import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Set axios default header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user from token on first load
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/api/auth/me`);
        setUser(res.data);
      } catch (err) {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = async (username, password) => {
    const res = await axios.post(`${API_BASE}/api/auth/login`, {
      username,
      password
    });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    return newUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAdmin = () => user?.role === 'admin';

  const canAdd    = () => isAdmin() || user?.permissions?.canAdd    === true;
  const canDelete = () => isAdmin() || user?.permissions?.canDelete === true;

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, logout,
      isAdmin, canAdd, canDelete
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);