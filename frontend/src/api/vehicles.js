import apiClient from './client';

export const vehiclesAPI = {
    getAllVehicles: async () => {
        const response = await apiClient.get('/vehicles');
        return response.data;
    },
    getVehicleById: async (id) => {
        const response = await apiClient.get(`/vehicles/${id}`);
        return response.data;
    },
    createVehicle: async (data) => {
        const response = await apiClient.post('/vehicles', data);
        return response.data;
    },
    updateVehicle: async (id, data) => {
        const response = await apiClient.put(`/vehicles/${id}`, data);
        return response.data;
    },
    deleteVehicle: async (id) => {
        const response = await apiClient.delete(`/vehicles/${id}`);
        return response.data;
    }
};
