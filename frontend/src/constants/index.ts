// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        GOOGLE_LOGIN: `${API_BASE_URL}/auth/google`,
        LOGOUT: `${API_BASE_URL}/auth/logout`,
        REFRESH: `${API_BASE_URL}/auth/refresh`,
        ME: `${API_BASE_URL}/auth/me`,
    },
    USERS: {
        PROFILE: `${API_BASE_URL}/users/profile`,
        UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
    },
};

// Local Storage Keys
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user',
};
