const { query } = require('../config/database');

exports.getAllOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, customerId } = req.query;
        const offset = (page - 1) * limit;

        let queryText = `
            SELECT 
                   v.order_id as id,
                   v.customer as company_name,
                   v.unique_items_count as item_count,
                   v.total_amount,
                   v.order_status as status,
                   v.shipment_status,
                   v.expected_arrival,
                   o.payment_status,
                   o.order_date -- Keep original date for sorting if view doesn't have it (View has order_date)
            FROM v_OrderFulfillmentStatus v
            JOIN orders o ON v.order_id = o.id -- Join to keep customer_id filter working
            WHERE 1=1
        `;
        const queryParams = [];
        let paramCount = 1;

        if (status) {
            queryText += ` AND o.status = $${paramCount} `;
            queryParams.push(status);
            paramCount++;
        }

        if (customerId) {
            queryText += ` AND o.customer_id = $${paramCount} `;
            queryParams.push(customerId);
            paramCount++;
        }

        queryText += ` ORDER BY o.order_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1} `;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        // Get total count
        const countResult = await query('SELECT COUNT(*) FROM orders');
        const totalCount = parseInt(countResult.rows[0].count);

        res.json({
            orders: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / limit),
                totalCount
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getOrderStats = async (req, res, next) => {
    try {
        // Get total orders
        const totalOrdersResult = await query('SELECT COUNT(*) FROM orders');
        const totalOrders = parseInt(totalOrdersResult.rows[0].count);

        // Get total revenue
        // Get total revenue (only paid orders)
        const revenueResult = await query("SELECT SUM(total_amount) as total FROM orders WHERE payment_status = 'paid'");
        const totalRevenue = parseFloat(revenueResult.rows[0].total || 0);

        // Get status counts
        const statusResult = await query(`
            SELECT status, COUNT(*) as count 
            FROM orders 
            GROUP BY status
            `);

        const statusCounts = {};
        statusResult.rows.forEach(row => {
            statusCounts[row.status] = parseInt(row.count);
        });

        // Get recent activity (last 5 orders)
        const recentResult = await query(`
            SELECT o.id, o.total_amount, o.status, o.order_date, c.company_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            ORDER BY o.order_date DESC
            LIMIT 5
            `);

        res.json({
            totalOrders,
            totalRevenue,
            statusCounts,
            recentOrders: recentResult.rows
        });
    } catch (error) {
        next(error);
    }
};

exports.getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const orderResult = await query(`
            SELECT o.*,
            c.company_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.id = $1
            `, [id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // 2. Get Order Items
        // 2. Get Order Items with Shipped Quantity
        const itemsResult = await query(`
            WITH shipped_items AS(
                SELECT 
                    s.order_id,
                elem ->> 'product_id' as product_id,
                SUM((elem ->> 'quantity'):: int) as shipped_qty
                FROM shipments s,
                jsonb_array_elements(s.items) elem
                WHERE s.order_id = $1
                GROUP BY s.order_id, elem ->> 'product_id'
            )
        SELECT
        oi.*,
            p.name as product_name, p.sku, p.category, p.weight_per_unit,
            COALESCE(si.shipped_qty, 0) as quantity_shipped
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN shipped_items si ON oi.order_id = si.order_id 
                                       AND oi.product_id = (si.product_id):: int
            WHERE oi.order_id = $1
            `, [id]);

        order.items = itemsResult.rows;

        res.json(order);
    } catch (error) {
        next(error);
    }
};

exports.createOrder = async (req, res, next) => {
    try {
        const { customerId, items } = req.body;
        // Expected format: items = [{ product_id: 1, quantity: 5 }, ...]

        if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Customer ID and Items (array) are required' });
        }

        // Convert items array to JSON string for the stored procedure
        const itemsJson = JSON.stringify(items);
        let orderId = null;



        const result = await query(
            `CALL place_order($1, $2, $3)`,
            [customerId, itemsJson, null]
        );


        const createdOrderId = result.rows[0].p_order_id;

        res.status(201).json({
            message: 'Order created successfully',
            orderId: createdOrderId
        });
    } catch (error) {
        // Handle custom exception from PL/SQL (e.g., Insufficient Stock)
        if (error.message.includes('Insufficient stock')) {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};

exports.updateOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, payment_status, quantity, unitPrice } = req.body;

        let updateQuery = 'UPDATE orders SET ';
        const queryParams = [];
        let paramCount = 1;

        if (status) {
            updateQuery += `status = $${paramCount}, `;
            queryParams.push(status);
            paramCount++;
        }

        if (payment_status) {
            updateQuery += `payment_status = $${paramCount}, `;
            queryParams.push(payment_status);
            paramCount++;
        }

        if (status === 'cancelled') {
            // Get order items to release reservation
            const itemsQuery = await query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id]);


            const currentOrder = await query('SELECT status FROM orders WHERE id = $1', [id]);
            if (currentOrder.rows[0].status !== 'cancelled' && currentOrder.rows[0].status !== 'shipped' && currentOrder.rows[0].status !== 'delivered') {
                for (const item of itemsQuery.rows) {


                    let remaining = item.quantity;
                    const reservedStock = await query(
                        'SELECT id, reserved_quantity FROM inventory WHERE product_id = $1 AND reserved_quantity > 0 ORDER BY reserved_quantity DESC',
                        [item.product_id]
                    );

                    for (const inv of reservedStock.rows) {
                        if (remaining <= 0) break;
                        const release = Math.min(remaining, inv.reserved_quantity);
                        await query('UPDATE inventory SET reserved_quantity = reserved_quantity - $1 WHERE id = $2', [release, inv.id]);
                        remaining -= release;
                    }
                }
            }
        }

        // Remove trailing comma
        updateQuery = updateQuery.slice(0, -2);

        updateQuery += ` WHERE id = $${paramCount} RETURNING * `;
        queryParams.push(id);

        if (queryParams.length === 1) { // Only ID present
            return res.status(400).json({ error: 'No fields to update' });
        }

        const result = await query(updateQuery, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Release Stock before deletion (if pending)
        const currentOrder = await query('SELECT status FROM orders WHERE id = $1', [id]);
        if (currentOrder.rows.length > 0) {
            const status = currentOrder.rows[0].status;
            if (['pending', 'processing'].includes(status)) {
                const itemsQuery = await query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id]);
                for (const item of itemsQuery.rows) {
                    let remaining = item.quantity;
                    const reservedStock = await query(
                        'SELECT id, reserved_quantity FROM inventory WHERE product_id = $1 AND reserved_quantity > 0 ORDER BY reserved_quantity DESC',
                        [item.product_id]
                    );

                    for (const inv of reservedStock.rows) {
                        if (remaining <= 0) break;
                        const release = Math.min(remaining, inv.reserved_quantity);
                        await query('UPDATE inventory SET reserved_quantity = reserved_quantity - $1 WHERE id = $2', [release, inv.id]);
                        remaining -= release;
                    }
                }
            }
        }

        const result = await query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        next(error);
    }
};
