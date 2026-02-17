import apiClient from './client';

export const warehouseAPI = {
    getAllWarehouses: async () => {
        const response = await apiClient.get('/warehouses');
        return response.data; // Assuming it returns { warehouses: [...] }
    },

    getWarehouseById: async (id) => {
        const response = await apiClient.get(`/warehouses/${id}`);
        return response.data;
    }
};
