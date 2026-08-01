import axios from "axios";

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem("custom_api_url");
    if (customUrl) return customUrl;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return 'https://beer-shop-backend-bhe0.onrender.com';
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return `http://${host}:5000`;
  }
  return 'http://localhost:5000';
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {

        config.headers.Authorization = `Bearer ${token}`;

    }

    return config;

});

api.interceptors.response.use(

    response => response,

    error => {

        if (error.response?.status === 401) {

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "/login";

        }

        return Promise.reject(error);

    }

);

export default api;