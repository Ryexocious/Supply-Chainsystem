import apiClient from './client';

export const shipmentsAPI = {
    getAllShipments: async (params) => {
        const response = await apiClient.get('/shipments', { params });
        return response.data;
    },
    getShipmentById: async (id) => {
        const response = await apiClient.get(`/shipments/${id}`);
        return response.data;
    },
    createShipment: async (shipmentData) => {
        const response = await apiClient.post('/shipments', shipmentData);
        return response.data;
    },
    updateShipment: async (id, shipmentData) => {
        const response = await apiClient.put(`/shipments/${id}`, shipmentData);
        return response.data;
    },
    deleteShipment: async (id) => {
        const response = await apiClient.delete(`/shipments/${id}`);
        return response.data;
    }
};
