import apiClient from './client';

export const productsAPI = {
    getAllProducts: async (params = {}) => {
        const response = await apiClient.get('/products', { params });
        return response.data;
    },

    getProduct: async (id) => {
        const response = await apiClient.get(`/products/${id}`);
        return response.data;
    },

    createProduct: async (data) => {
        const response = await apiClient.post('/products', data);
        return response.data;
    },

    updateProduct: async (id, data) => {
        const response = await apiClient.put(`/products/${id}`, data);
        return response.data;
    },

    deleteProduct: async (id) => {
        const response = await apiClient.delete(`/products/${id}`);
        return response.data;
    },

    getCategories: async () => {
        const response = await apiClient.get('/products/categories');
        return response.data;
    },
};
