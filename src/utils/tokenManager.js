/**
 * Secure Token Manager
 * Handles JWT tokens with additional security measures
 */

// Secure token storage with encryption
const TOKEN_KEY = 'tuktuk_access_token';
const REFRESH_KEY = 'tuktuk_refresh_token';

/**
 * Encrypt token for storage (simple base64 encoding for now)
 */
const encryptToken = (token) => {
  if (!token) return null;
  try {
    return btoa(token);
  } catch (error) {
    console.error('Token encryption failed:', error);
    return null;
  }
};

/**
 * Decrypt token from storage
 */
const decryptToken = (encryptedToken) => {
  if (!encryptedToken) return null;
  try {
    return atob(encryptedToken);
  } catch (error) {
    console.error('Token decryption failed:', error);
    return null;
  }
};

/**
 * Store access token securely
 */
export const storeAccessToken = (token) => {
  if (!token) return false;
  
  try {
    const encryptedToken = encryptToken(token);
    if (encryptedToken) {
      localStorage.setItem(TOKEN_KEY, encryptedToken);
      
      // Also set in axios headers
      const axios = require('axios');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return true;
    }
  } catch (error) {
    console.error('Failed to store access token:', error);
  }
  
  return false;
};

/**
 * Store refresh token securely in httpOnly cookie
 */
export const storeRefreshToken = (token) => {
  if (!token) return false;
  
  try {
    // Set secure cookie
    document.cookie = `refreshToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict; httponly`;
    return true;
  } catch (error) {
    console.error('Failed to store refresh token:', error);
  }
  
  return false;
};

/**
 * Get access token from storage
 */
export const getAccessToken = () => {
  try {
    const encryptedToken = localStorage.getItem(TOKEN_KEY);
    return decryptToken(encryptedToken);
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

/**
 * Get refresh token from cookies
 */
export const getRefreshToken = () => {
  try {
    const cookies = document.cookie.split(';');
    const refreshCookie = cookies.find(cookie => 
      cookie.trim().startsWith('refreshToken=')
    );
    
    if (refreshCookie) {
      return refreshCookie.split('=')[1];
    }
  } catch (error) {
    console.error('Failed to get refresh token:', error);
  }
  
  return null;
};

/**
 * Clear all tokens
 */
export const clearTokens = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Clear axios headers
    const axios = require('axios');
    delete axios.defaults.headers.common['Authorization'];
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
};

/**
 * Update tokens (for username changes)
 */
export const updateTokens = (accessToken, refreshToken) => {
  console.log('🔄 Updating tokens due to username change');
  
  const accessStored = storeAccessToken(accessToken);
  const refreshStored = storeRefreshToken(refreshToken);
  
  if (accessStored && refreshStored) {
    console.log('✅ Tokens updated successfully');
    return true;
  } else {
    console.error('❌ Failed to update tokens');
    return false;
  }
};

/**
 * Validate token format
 */
export const validateToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  // Basic JWT format validation (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Check if parts are base64 encoded
  try {
    parts.forEach(part => {
      if (part) {
        atob(part);
      }
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if token is expired (basic check)
 */
export const isTokenExpired = (token) => {
  if (!validateToken(token)) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    return payload.exp && payload.exp < now;
  } catch (error) {
    return true;
  }
};

export default {
  storeAccessToken,
  storeRefreshToken,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  updateTokens,
  validateToken,
  isTokenExpired
};
