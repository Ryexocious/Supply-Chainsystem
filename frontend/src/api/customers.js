import apiClient from './client';

export const customersAPI = {
    getAllCustomers: async (params) => {
        const response = await apiClient.get('/customers', { params });
        return response.data;
    },
    getCustomerById: async (id) => {
        const response = await apiClient.get(`/customers/${id}`);
        return response.data;
    },
    createCustomer: async (data) => {
        const response = await apiClient.post('/customers', data);
        return response.data;
    },
    updateCustomer: async (id, data) => {
        const response = await apiClient.put(`/customers/${id}`, data);
        return response.data;
    },
    deleteCustomer: async (id) => {
        const response = await apiClient.delete(`/customers/${id}`);
        return response.data;
    }
};
