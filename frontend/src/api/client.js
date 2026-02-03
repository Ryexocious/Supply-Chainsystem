import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Prevent redirect loop if the error comes from login endpoint
        const isLoginRequest = error.config?.url?.includes('/auth/login');

        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        if (!error.response) {
            return Promise.reject({
                message: 'Network error. Please check your connection.',
            });
        }

        return Promise.reject({
            message: error.response?.data?.error || 'An error occurred',
            status: error.response?.status,
            data: error.response?.data // Pass full data to handle specific fields like existingRecord
        });
    }
);

export default apiClient;