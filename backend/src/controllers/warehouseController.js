const { query } = require('../config/database');

exports.getAllWarehouses = async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM warehouses ORDER BY location_name');
        res.json({ warehouses: result.rows });
    } catch (error) {
        next(error);
    }
};
