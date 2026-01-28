const { query } = require('../config/database');

exports.getAllCustomers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, region, search } = req.query;
        const offset = (page - 1) * limit;

        let queryText = `
      SELECT c.*, 
             COUNT(*) OVER() as total_count,
             COUNT(o.id) as total_orders,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE 1=1
    `;
        const queryParams = [];
        let paramCount = 1;

        if (region) {
            queryText += ` AND c.region = $${paramCount}`;
            queryParams.push(region);
            paramCount++;
        }

        if (search) {
            queryText += ` AND c.company_name ILIKE $${paramCount}`;
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        queryText += ` GROUP BY c.id ORDER BY c.company_name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);
        const totalCount = result.rows.length > 0 ? result.rows[0].total_count : 0;

        res.json({
            customers: result.rows.map(row => {
                const { total_count, ...customer } = row;
                return customer;
            }),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / limit),
                totalCount: parseInt(totalCount)
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getCustomerById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const customerResult = await query(
            `SELECT c.*,
              COUNT(o.id) as total_orders,
              COALESCE(SUM(o.total_amount), 0) as total_spent
       FROM customers c
       LEFT JOIN orders o ON c.id = o.customer_id
       WHERE c.id = $1
       GROUP BY c.id`,
            [id]
        );

        if (customerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const ordersResult = await query(
            `SELECT * FROM orders 
       WHERE customer_id = $1 
       ORDER BY order_date DESC 
       LIMIT 10`,
            [id]
        );

        res.json({
            customer: customerResult.rows[0],
            recentOrders: ordersResult.rows
        });
    } catch (error) {
        next(error);
    }
};
