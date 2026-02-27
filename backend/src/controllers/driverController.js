const { query } = require('../config/database');

exports.getAllDrivers = async (req, res, next) => {
    try {
        const result = await query(`
      SELECT d.*, v.license_plate as vehicle_plate
      FROM drivers d
      LEFT JOIN vehicles v ON d.id = v.driver_id
      ORDER BY d.full_name
    `);
        res.json({ drivers: result.rows });
    } catch (error) {
        next(error);
    }
};

exports.getDriverById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(`
      SELECT d.*, v.license_plate, v.max_capacity
      FROM drivers d
      LEFT JOIN vehicles v ON d.id = v.driver_id
      WHERE d.id = $1
    `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.json({ driver: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

exports.createDriver = async (req, res, next) => {
    try {
        const { fullName, licenseNumber, licenseType } = req.body;
        if (!fullName || !licenseNumber) {
            return res.status(400).json({ error: 'Full name and license number are required' });
        }
        const result = await query(
            `INSERT INTO drivers (full_name, license_number, license_type, status)
       VALUES ($1, $2, $3, 'available') RETURNING *`,
            [fullName, licenseNumber, licenseType]
        );
        res.status(201).json({
            message: 'Driver created successfully',
            driver: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.updateDriver = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fullName, licenseType, status } = req.body;
        const result = await query(
            `UPDATE drivers 
       SET full_name = COALESCE($1, full_name),
           license_type = COALESCE($2, license_type),
           status = COALESCE($3, status)
       WHERE id = $4 RETURNING *`,
            [fullName, licenseType, status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.json({
            message: 'Driver updated successfully',
            driver: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteDriver = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM drivers WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.json({
            message: 'Driver deleted successfully',
            driver: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};
