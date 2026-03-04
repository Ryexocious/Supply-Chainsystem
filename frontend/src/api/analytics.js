import apiClient from './client';

export const analyticsAPI = {
    getCustomerLifetimeValue: async () => {
        const response = await apiClient.get('/analytics/clv');
        return response.data;
    },

    getMonthlySales: async () => {
        const response = await apiClient.get('/analytics/sales-report');
        return response.data;
    },

    getLowStockAlerts: async () => {
        const response = await apiClient.get('/analytics/low-stock');
        return response.data;
    },

    getDriverEfficiency: async () => {
        const response = await apiClient.get('/analytics/driver-efficiency');
        return response.data;
    },

    getInventoryValue: async () => {
        const response = await apiClient.get('/analytics/inventory-value');
        return response.data;
    },

    getDailySalesMovingAverage: async () => {
        const response = await apiClient.get('/analytics/daily-sales');
        return response.data;
    },

    getUnfulfilledHighValueOutputs: async () => {
        const response = await apiClient.get('/analytics/unfulfilled-high-value');
        return response.data;
    },

    getSupplierReliabilityAnalysis: async () => {
        const response = await apiClient.get('/analytics/supplier-reliability');
        return response.data;
    },

    getOrderStatusAudit: async () => {
        const response = await apiClient.get('/analytics/audit-logs/shipped');
        return response.data;
    },

    getOrphanedInventory: async () => {
        const response = await apiClient.get('/analytics/orphaned-inventory');
        return response.data;
    }
};

export default analyticsAPI;
