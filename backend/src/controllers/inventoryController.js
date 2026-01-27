const { query } = require('../config/database');

exports.getAllInventory = async (req, res, next) => {
    try {
        const { warehouseId, lowStock } = req.query;

        let queryText = `
      SELECT i.*, 
             p.name as product_name, p.sku, p.category,
             w.location_name as warehouse_name, w.max_capacity,
             CASE 
               WHEN (i.quantity - i.reserved_quantity) <= 10 THEN 'critical'
               WHEN (i.quantity - i.reserved_quantity) <= 50 THEN 'low'
               WHEN (i.quantity - i.reserved_quantity) <= 100 THEN 'medium'
               ELSE 'good'
             END as stock_level,
             (i.quantity - i.reserved_quantity) as available_quantity,
             i.quantity as physical_quantity
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE 1=1
    `;
        const queryParams = [];
        let paramCount = 1;

        if (warehouseId) {
            queryText += ` AND i.warehouse_id = $${paramCount}`;
            queryParams.push(warehouseId);
            paramCount++;
        }

        if (lowStock === 'true') {
            queryText += ` AND i.quantity <= 50`;
        }

        queryText += ` ORDER BY i.quantity ASC`;

        const result = await query(queryText, queryParams);
        res.json({ inventory: result.rows });
    } catch (error) {
        next(error);
    }
};

exports.getInventoryById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT i.*, 
              p.name as product_name, p.sku, p.price,
              w.location_name, w.address
       FROM inventory i
       LEFT JOIN products p ON i.product_id = p.id
       LEFT JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory record not found' });
        }

        res.json({ inventory: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

exports.updateInventory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quantity, operation = 'set' } = req.body;

        if (quantity === undefined) {
            return res.status(400).json({ error: 'Quantity is required' });
        }

        const currentResult = await query('SELECT * FROM inventory WHERE id = $1', [id]);

        if (currentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory record not found' });
        }

        let newQuantity;
        const currentQuantity = currentResult.rows[0].quantity;

        switch (operation) {
            case 'add':
                newQuantity = currentQuantity + quantity;
                break;
            case 'subtract':
                newQuantity = Math.max(0, currentQuantity - quantity);
                break;
            default:
                newQuantity = quantity;
        }

        const result = await query(
            `UPDATE inventory 
       SET quantity = $1, last_updated = NOW()
       WHERE id = $2 RETURNING *`,
            [newQuantity, id]
        );

        res.json({
            message: 'Inventory updated successfully',
            inventory: result.rows[0],
            previousQuantity: currentQuantity,
            operation
        });
    } catch (error) {
        next(error);
    }
};

exports.addInventory = async (req, res, next) => {
    try {
        const { productId, warehouseId, quantity } = req.body;

        if (!productId || !warehouseId || quantity === undefined) {
            return res.status(400).json({
                error: 'Missing required fields: productId, warehouseId, quantity'
            });
        }

        const existingCheck = await query(
            'SELECT * FROM inventory WHERE product_id = $1 AND warehouse_id = $2',
            [productId, warehouseId]
        );

        if (existingCheck.rows.length > 0) {
            return res.status(409).json({
                error: 'Inventory record already exists for this product and warehouse',
                existingRecord: existingCheck.rows[0]
            });
        }

        const result = await query(
            `INSERT INTO inventory (product_id, warehouse_id, quantity, last_updated)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [productId, warehouseId, quantity]
        );

        res.status(201).json({
            message: 'Inventory record created successfully',
            inventory: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.getLowStockAlerts = async (req, res, next) => {
    try {
        const threshold = req.query.threshold || 50;

        const result = await query(
            `SELECT * FROM v_RestockAlert
             WHERE quantity <= $1
             ORDER BY quantity ASC`,
            [threshold]
        );

        res.json({
            alerts: result.rows,
            count: result.rows.length,
            threshold: parseInt(threshold)
        });
    } catch (error) {
        next(error);
    }
};

exports.getInventoryByProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const result = await query(
            `SELECT i.id, i.quantity, i.warehouse_id, 
                    w.location_name, w.type as warehouse_type
             FROM inventory i
             JOIN warehouses w ON i.warehouse_id = w.id
             WHERE i.product_id = $1 AND i.quantity > 0
             ORDER BY i.quantity DESC`,
            [productId]
        );

        res.json({
            productId: parseInt(productId),
            stock: result.rows
        });
    } catch (error) {
        next(error);
    }
};