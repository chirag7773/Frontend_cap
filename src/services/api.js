import axios from 'axios';

// Create axios instance with base URL from environment variables
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5109/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method.toUpperCase(),
      url: config.baseURL + config.url,
      headers: config.headers,
      data: config.data
    });
    
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData?.token) {
      config.headers.Authorization = `Bearer ${userData.token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Only handle 401 errors for non-auth endpoints
    if (error.response?.status === 401 && !originalRequest.url.includes('/auth/')) {
      if (isRefreshing) {
        // If a refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData?.refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5109/api'}/auth/refresh-token`, {
          token: userData.token,
          refreshToken: userData.refreshToken
        });

        const { token, refreshToken } = response.data;
        
        // Update the token in localStorage
        userData.token = token;
        userData.refreshToken = refreshToken;
        localStorage.setItem('user', JSON.stringify(userData));

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Process any queued requests
        processQueue(null, token);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Only redirect to login if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
