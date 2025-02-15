import axios from 'axios';
import { toast } from 'react-toastify';

// Create an axios instance with base configuration
const api = axios.create({
 baseURL: 'https://ebra-travels-server.onrender.com/api',
 headers: {
   'Content-Type': 'application/json'
 }
});

// Request interceptor with debugging
api.interceptors.request.use((config) => {
 const token = localStorage.getItem('token');
 if (token) {
   config.headers.Authorization = `Bearer ${token}`;
 }
 
 // Debug logging
 console.log('API Request:', {
   url: config.url,
   method: config.method,
   headers: config.headers,
   data: config.data
 });
 
 return config;
}, (error) => {
 console.error('Request Error:', error);
 return Promise.reject(error);
});

// Response interceptor with enhanced error handling
api.interceptors.response.use(
 (response) => {
   // Debug successful response
   console.log('API Response:', {
     url: response.config.url,
     status: response.status,
     data: response.data
   });
   return response;
 },
 (error) => {
   // Enhanced error logging
   console.error('API Error:', {
     url: error.config?.url,
     status: error.response?.status,
     message: error.response?.data?.message,
     data: error.response?.data
   });

   // Handle specific status codes
   switch (error.response?.status) {
     case 401:
       authService.logout();
       window.location.href = '/admin';
       toast.error('Session expired. Please login again.');
       break;
     case 403:
       toast.error('Access denied. You do not have permission.');
       break;
     case 404:
       toast.error('Resource not found.');
       break;
     case 500:
       toast.error('Server error. Please try again later.');
       break;
     default:
       toast.error(error.response?.data?.message || 'An error occurred');
   }

   return Promise.reject(error);
 }
);

// Authentication Services
export const authService = {
 // Login API
 login: async (email, password) => {
   try {
     console.log('Login attempt:', { email });
     const response = await api.post('/auth/login', { email, password });
     
     if (response.data.token) {
       localStorage.setItem('token', response.data.token);
       localStorage.setItem('user', JSON.stringify(response.data));
       console.log('Login successful');
       toast.success('Login successful!');
     }
     
     return response.data;
   } catch (error) {
     console.error('Login Error:', {
       status: error.response?.status,
       message: error.response?.data?.message
     });
     toast.error(error.response?.data?.message || 'Login failed');
     throw error;
   }
 },

 // Logout with cleanup
 logout: () => {
   try {
     console.log('Logging out user');
     localStorage.removeItem('token');
     localStorage.removeItem('user');
     // Clear any cached data
     sessionStorage.clear();
     toast.info('Logged out successfully');
   } catch (error) {
     console.error('Logout Error:', error);
     // Ensure items are removed even if there's an error
     localStorage.removeItem('token');
     localStorage.removeItem('user');
   }
 },

 // Change Password with validation
 changePassword: async (currentPassword, newPassword) => {
   try {
     const response = await api.put('/auth/change-password', {
       currentPassword,
       newPassword
     });
     toast.success('Password changed successfully');
     return response.data;
   } catch (error) {
     console.error('Change Password Error:', {
       status: error.response?.status,
       message: error.response?.data?.message
     });
     toast.error(error.response?.data?.message || 'Failed to change password');
     throw error;
   }
 },

 // Enhanced authentication check
 isAuthenticated: () => {
   try {
     const token = localStorage.getItem('token');
     const user = localStorage.getItem('user');
     return !!(token && user && JSON.parse(user));
   } catch (error) {
     console.error('Auth Check Error:', error);
     return false;
   }
 },

 // Get current user with validation
 getCurrentUser: () => {
   try {
     const userStr = localStorage.getItem('user');
     if (!userStr) return null;
     
     const user = JSON.parse(userStr);
     return user;
   } catch (error) {
     console.error('Get User Error:', error);
     // Clear invalid data
     localStorage.removeItem('user');
     return null;
   }
 }
};

export default api;
