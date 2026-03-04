import analyticsAPI from '../api/analytics';

export const getCustomerLifetimeValue = async () => {
    return await analyticsAPI.getCustomerLifetimeValue();
};

export const getMonthlySales = async () => {
    return await analyticsAPI.getMonthlySales();
};

export const getLowStockAlerts = async () => {
    return await analyticsAPI.getLowStockAlerts();
};

export const getDriverEfficiency = async () => {
    return await analyticsAPI.getDriverEfficiency();
};

export const getInventoryValue = async () => {
    return await analyticsAPI.getInventoryValue();
};

export const getDailySalesMovingAverage = async () => {
    return await analyticsAPI.getDailySalesMovingAverage();
};

export const getUnfulfilledHighValueOutputs = async () => {
    return await analyticsAPI.getUnfulfilledHighValueOutputs();
};

export const getSupplierReliabilityAnalysis = async () => {
    return await analyticsAPI.getSupplierReliabilityAnalysis();
};

export const getOrderStatusAudit = async () => {
    return await analyticsAPI.getOrderStatusAudit();
};

export const getOrphanedInventory = async () => {
    return await analyticsAPI.getOrphanedInventory();
};
