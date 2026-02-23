const { query } = require('../config/database');

exports.getAllVehicles = async (req, res, next) => {
    try {
        const result = await query(`
      SELECT v.*, d.full_name as driver_name
      FROM vehicles v
      LEFT JOIN drivers d ON v.driver_id = d.id
      ORDER BY v.license_plate
    `);
        res.json({ vehicles: result.rows });
    } catch (error) {
        next(error);
    }
};

exports.getVehicleById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(`
      SELECT v.*, d.full_name as driver_name, d.license_number as driver_license
      FROM vehicles v
      LEFT JOIN drivers d ON v.driver_id = d.id
      WHERE v.id = $1
    `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json({ vehicle: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

exports.createVehicle = async (req, res, next) => {
    try {
        const { driverId, maxCapacity, licensePlate } = req.body;
        if (!licensePlate || !maxCapacity) {
            return res.status(400).json({ error: 'License plate and max capacity are required' });
        }
        const result = await query(
            `INSERT INTO vehicles (driver_id, max_capacity, current_status, license_plate)
       VALUES ($1, $2, 'available', $3) RETURNING *`,
            [driverId, maxCapacity, licensePlate]
        );
        res.status(201).json({
            message: 'Vehicle created successfully',
            vehicle: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.updateVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { driverId, maxCapacity, currentStatus } = req.body;
        const result = await query(
            `UPDATE vehicles 
       SET driver_id = COALESCE($1, driver_id),
           max_capacity = COALESCE($2, max_capacity),
           current_status = COALESCE($3, current_status)
       WHERE id = $4 RETURNING *`,
            [driverId, maxCapacity, currentStatus, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json({
            message: 'Vehicle updated successfully',
            vehicle: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json({
            message: 'Vehicle deleted successfully',
            vehicle: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};
