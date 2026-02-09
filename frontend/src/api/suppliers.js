import apiClient from './client';

export const suppliersAPI = {
    getAllSuppliers: async () => {
        const response = await apiClient.get('/suppliers');
        return response.data;
    },

    getSupplierById: async (id) => {
        const response = await apiClient.get(`/suppliers/${id}`);
        return response.data;
    },

    createSupplier: async (data) => {
        const response = await apiClient.post('/suppliers', data);
        return response.data;
    },

    updateSupplier: async (id, data) => {
        const response = await apiClient.put(`/suppliers/${id}`, data);
        return response.data;
    },

    deleteSupplier: async (id) => {
        const response = await apiClient.delete(`/suppliers/${id}`);
        return response.data;
    }
};
