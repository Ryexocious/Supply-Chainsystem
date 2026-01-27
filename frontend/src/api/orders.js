import apiClient from './client';

export const ordersAPI = {
    getAllOrders: async (params = {}) => {
        const response = await apiClient.get('/orders', { params });
        return response.data;
    },

    getOrderStats: async () => {
        const response = await apiClient.get('/orders/stats');
        return response.data;
    },

    getOrderById: async (id) => {
        const response = await apiClient.get(`/orders/${id}`);
        return response.data;
    },

    createOrder: async (data) => {
        const response = await apiClient.post('/orders', data);
        return response.data;
    },

    updateOrder: async (id, data) => {
        const response = await apiClient.put(`/orders/${id}`, data);
        return response.data;
    },

    deleteOrder: async (id) => {
        const response = await apiClient.delete(`/orders/${id}`);
        return response.data;
    }
};