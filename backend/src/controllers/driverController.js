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