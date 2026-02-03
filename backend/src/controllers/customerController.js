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
exports.createCustomer = async (req, res, next) => {
    try {
        const { companyName, email, phone, billingAddress, region, creditLimit } = req.body;

        if (!companyName) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        const result = await query(
            `INSERT INTO customers (company_name, email, phone, billing_address, region, credit_limit)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [companyName, email, phone, billingAddress, region, creditLimit || 0]
        );

        res.status(201).json({
            message: 'Customer created successfully',
            customer: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.updateCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { companyName, email, phone, billingAddress, region, creditLimit } = req.body;

        const checkResult = await query('SELECT * FROM customers WHERE id = $1', [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const result = await query(
            `UPDATE customers 
       SET company_name = COALESCE($1, company_name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           billing_address = COALESCE($4, billing_address),
           region = COALESCE($5, region),
           credit_limit = COALESCE($6, credit_limit)
       WHERE id = $7 RETURNING *`,
            [companyName, email, phone, billingAddress, region, creditLimit, id]
        );

        res.json({
            message: 'Customer updated successfully',
            customer: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({
            message: 'Customer deleted successfully',
            customer: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};
