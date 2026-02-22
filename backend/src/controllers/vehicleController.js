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