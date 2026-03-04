const { query } = require('../config/database');

exports.getCustomerLifetimeValue = async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                c.company_name,
                COUNT(o.id) AS total_orders,
                SUM(o.total_amount) AS total_spend,
                RANK() OVER (ORDER BY SUM(o.total_amount) DESC) as spend_rank,
                CASE 
                    WHEN SUM(o.total_amount) > 10000 THEN 'Platinum'
                    WHEN SUM(o.total_amount) > 5000 THEN 'Gold'
                    ELSE 'Silver'
                END as tier
            FROM customers c
            JOIN orders o ON c.id = o.customer_id
            WHERE o.status != 'cancelled'
            GROUP BY c.id, c.company_name
            LIMIT 20;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getMonthlySales = async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                TO_CHAR(o.order_date, 'YYYY-MM') AS month,
                p.category,
                SUM(oi.total_price) AS revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            GROUP BY ROLLUP(TO_CHAR(o.order_date, 'YYYY-MM'), p.category)
            ORDER BY month, p.category;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getLowStockAlerts = async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                p.name as name, 
                i.quantity as quantity, 
                w.location_name
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            JOIN warehouses w ON i.warehouse_id = w.id
            WHERE i.quantity < 50
            ORDER BY i.quantity ASC;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getUnfulfilledHighValueOutputs = async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                o.id as order_id, 
                c.company_name, 
                o.total_amount, 
                o.order_date
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.status = 'pending' 
              AND o.total_amount > 500
              AND o.order_date < NOW() - INTERVAL '2 days'
            ORDER BY o.order_date ASC;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getSupplierReliabilityAnalysis = async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                s.name as supplier_name,
                COUNT(p.id) as products_count,
                AVG(p.price) as avg_product_price
            FROM suppliers s
            JOIN product_suppliers ps ON s.id = ps.supplier_id
            JOIN products p ON ps.product_id = p.id
            GROUP BY s.id, s.name
            ORDER BY s.name ASC;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getOrderStatusAudit = async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                u.full_name as changed_by,
                al.changed_at,
                al.record_id as order_id
            FROM audit_logs al
            JOIN users u ON al.changed_by = u.id
            WHERE al.table_name = 'shipments' 
              AND al.new_data->>'status' = 'delivered'
            ORDER BY al.changed_at DESC;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getOrphanedInventory = async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                p.name as product_name, 
                i.quantity as stock_quantity
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            LEFT JOIN order_items oi ON p.id = oi.product_id 
                AND oi.order_id IN (SELECT id FROM orders WHERE order_date > NOW() - INTERVAL '6 months')
            WHERE oi.id IS NULL
            ORDER BY i.quantity DESC;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getDriverEfficiency = async (req, res, next) => {
    try {
        const sql = `
            WITH DriverStats AS (
                SELECT 
                    d.full_name,
                    COUNT(s.id) as deliveries,
                    AVG(EXTRACT(EPOCH FROM (s.actual_arrival - s.departure_time))/3600) as avg_hours
                FROM drivers d
                JOIN vehicles v ON d.id = v.driver_id
                JOIN shipments s ON v.id = s.vehicle_id
                WHERE s.status = 'delivered'
                GROUP BY d.full_name
            )
            SELECT * FROM DriverStats WHERE deliveries > 0;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getInventoryValue = async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                w.location_name,
                COUNT(i.product_id) as unique_products,
                SUM(i.quantity) as total_items,
                SUM(i.quantity * p.price) as total_inventory_value
            FROM warehouses w
            JOIN inventory i ON w.id = i.warehouse_id
            JOIN products p ON i.product_id = p.id
            GROUP BY w.id, w.location_name;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getDailySalesMovingAverage = async (req, res, next) => {
    try {
        const sql = `
            SELECT 
                order_date::DATE as date,
                SUM(total_amount) as daily_revenue,
                AVG(SUM(total_amount)) OVER (
                    ORDER BY order_date::DATE 
                    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
                ) as seven_day_moving_avg
            FROM orders
            GROUP BY order_date::DATE
            ORDER BY order_date::DATE DESC
            LIMIT 30;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};
