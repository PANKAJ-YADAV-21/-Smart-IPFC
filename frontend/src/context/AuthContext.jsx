import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(sessionStorage.getItem('token'));

  useEffect(() => {
    axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('/login', { email, password });
    const { token, user } = response.data.authorisation ? { token: response.data.authorisation.token, user: response.data.user } : response.data;
    sessionStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    return response.data;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const register = async (userData) => {
    const response = await axios.post('/register', userData);
    return response.data;
  };

  const forgotPassword = async (email) => {
    return (await axios.post('/forgot-password', { email })).data;
  };

  const resetPassword = async (data) => {
    return (await axios.post('/reset-password', data)).data;
  };

  const sendOtp = async () => {
    return (await axios.post('/send-otp')).data;
  };

  const verifyOtp = async (otp) => {
    return (await axios.post('/verify-otp', { otp })).data;
  };

  const resendVerification = async () => {
    return (await axios.post('/email/resend')).data;
  };

  const resendVerificationPublic = async (email) => {
    return (await axios.post('/email/resend-public', { email })).data;
  };

  const verifyEmail = async (otp) => {
    return (await axios.post('/email/verify', { otp })).data;
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, logout, register, isAuthenticated: !!user,
      forgotPassword, resetPassword, sendOtp, verifyOtp, resendVerification, resendVerificationPublic, verifyEmail, fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
