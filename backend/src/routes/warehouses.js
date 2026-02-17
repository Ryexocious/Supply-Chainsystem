const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', warehouseController.getAllWarehouses);
router.get('/:id', warehouseController.getWarehouseById);
router.post('/', warehouseController.createWarehouse);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);

module.exports = router;