import apiClient from './client';

export const inventoryAPI = {
    getAllInventory: async (params = {}) => {
        const response = await apiClient.get('/inventory', { params });
        return response.data;
    },

    getInventoryById: async (id) => {
        const response = await apiClient.get(`/inventory/${id}`);
        return response.data;
    },

    addInventory: async (data) => {
        const response = await apiClient.post('/inventory', data);
        return response.data;
    },

    updateInventory: async (id, data) => {
        const response = await apiClient.put(`/inventory/${id}`, data);
        return response.data;
    },

    getLowStockAlerts: async (threshold = 50) => {
        const response = await apiClient.get('/inventory/alerts/low-stock', {
            params: { threshold },
        });
        return response.data;
    },
};

export default inventoryAPI;