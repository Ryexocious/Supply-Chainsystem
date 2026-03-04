const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/clv', analyticsController.getCustomerLifetimeValue);
router.get('/sales-report', analyticsController.getMonthlySales);
router.get('/low-stock', analyticsController.getLowStockAlerts);
router.get('/driver-efficiency', analyticsController.getDriverEfficiency);
router.get('/inventory-value', analyticsController.getInventoryValue);
router.get('/daily-sales', analyticsController.getDailySalesMovingAverage);

// New Required Analytical Queries:
router.get('/unfulfilled-high-value', analyticsController.getUnfulfilledHighValueOutputs);
router.get('/supplier-reliability', analyticsController.getSupplierReliabilityAnalysis);
router.get('/audit-logs/shipped', analyticsController.getOrderStatusAudit);
router.get('/orphaned-inventory', analyticsController.getOrphanedInventory);

module.exports = router;
