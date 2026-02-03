const { query } = require('../config/database');

exports.getAllVehicles = async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM vehicles ORDER BY license_plate');
        res.json({ vehicles: result.rows });
    } catch (error) {
        next(error);
    }
};
