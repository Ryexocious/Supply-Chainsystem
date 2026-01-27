const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', inventoryController.getAllInventory);
router.get('/product/:productId', inventoryController.getInventoryByProduct);
router.get('/alerts/low-stock', inventoryController.getLowStockAlerts);
router.get('/:id', inventoryController.getInventoryById);
router.post('/', inventoryController.addInventory);
router.put('/:id', inventoryController.updateInventory);

module.exports = router;