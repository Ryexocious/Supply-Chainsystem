const { query } = require('../config/database');

exports.getRecentActivity = async (req, res, next) => {
    try {
        // Fetch recent orders
        const ordersQuery = `
            SELECT 'order' as type, id, order_date as date, 'New order received' as title,
                   'Order #' || id || ' placed' as description
            FROM orders
            ORDER BY order_date DESC
            LIMIT 5
        `;

        // Fetch recent shipments (delivered)
        const shipmentsQuery = `
            SELECT 'shipment' as type, id, actual_arrival as date, 'Shipment delivered' as title,
                   'Shipment #' || id || ' delivered' as description
            FROM shipments
            WHERE status = 'delivered' AND actual_arrival IS NOT NULL
            ORDER BY actual_arrival DESC
            LIMIT 5
        `;

        // Execute both
        const [ordersRes, shipmentsRes] = await Promise.all([
            query(ordersQuery),
            query(shipmentsQuery)
        ]);

        // Combine and sort
        const activities = [...ordersRes.rows, ...shipmentsRes.rows]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        res.json(activities);
    } catch (error) {
        next(error);
    }
};
