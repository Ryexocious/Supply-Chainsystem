const { query } = require('../config/database');

exports.getAllWarehouses = async (req, res, next) => {
    try {
        const result = await query(`
      SELECT w.*,
             COUNT(i.id) as total_items,
             COALESCE(SUM(i.quantity), 0) as total_stock,
             get_warehouse_utilization(w.id) as utilization_percentage
      FROM warehouses w
      LEFT JOIN inventory i ON w.id = i.warehouse_id
      GROUP BY w.id
      ORDER BY w.location_name
    `);
        res.json({ warehouses: result.rows });
    } catch (error) {
        next(error);
    }
};

exports.getWarehouseById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(`
      SELECT w.*,
             COUNT(i.id) as total_items,
             COALESCE(SUM(i.quantity), 0) as total_stock,
             get_warehouse_utilization(w.id) as utilization_percentage
      FROM warehouses w
      LEFT JOIN inventory i ON w.id = i.warehouse_id
      WHERE w.id = $1
      GROUP BY w.id
    `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Warehouse not found' });
        }
        res.json({ warehouse: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

exports.createWarehouse = async (req, res, next) => {
    try {
        const { locationName, address, maxCapacity, type } = req.body;
        if (!locationName || !maxCapacity) {
            return res.status(400).json({ error: 'Location name and max capacity are required' });
        }
        const result = await query(
            `INSERT INTO warehouses (location_name, address, max_capacity, type, is_active)
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
            [locationName, address, maxCapacity, type]
        );
        res.status(201).json({
            message: 'Warehouse created successfully',
            warehouse: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.updateWarehouse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { locationName, address, maxCapacity, type, isActive } = req.body;
        const result = await query(
            `UPDATE warehouses 
       SET location_name = COALESCE($1, location_name),
           address = COALESCE($2, address),
           max_capacity = COALESCE($3, max_capacity),
           type = COALESCE($4, type),
           is_active = COALESCE($5, is_active)
       WHERE id = $6 RETURNING *`,
            [locationName, address, maxCapacity, type, isActive, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Warehouse not found' });
        }
        res.json({
            message: 'Warehouse updated successfully',
            warehouse: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteWarehouse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM warehouses WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Warehouse not found' });
        }
        res.json({
            message: 'Warehouse deleted successfully',
            warehouse: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};
