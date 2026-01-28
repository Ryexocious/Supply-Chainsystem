const { query } = require('../config/database');

exports.getAllShipments = async (req, res, next) => {
    try {
        const result = await query(`
      SELECT s.*, 
             o.id as order_ref,
             v.license_plate,
             w.location_name
      FROM shipments s
      LEFT JOIN orders o ON s.order_id = o.id
      LEFT JOIN vehicles v ON s.vehicle_id = v.id
      LEFT JOIN warehouses w ON s.warehouse_id = w.id
      ORDER BY s.departure_time DESC
    `);
        res.json({ shipments: result.rows });
    } catch (error) {
        next(error);
    }
};

exports.getShipmentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(`
      SELECT s.*, 
             o.id as order_ref,
             v.license_plate,
             w.location_name
      FROM shipments s
      LEFT JOIN orders o ON s.order_id = o.id
      LEFT JOIN vehicles v ON s.vehicle_id = v.id
      LEFT JOIN warehouses w ON s.warehouse_id = w.id
      WHERE s.id = $1
    `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        res.json({ shipment: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

exports.createShipment = async (req, res, next) => {
    try {
        const { orderId, vehicleId, warehouseId, departureTime, expectedArrival, items } = req.body;
        // items: [{ product_id: 1, quantity: 5 }]

        if (!orderId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Order ID and Items are required' });
        }

        // 1. Calculate Total Weight of THIS Shipment
        let totalWeight = 0;
        // Also validate stock
        for (const item of items) {
            const productRes = await query('SELECT weight_per_unit, price FROM products WHERE id = $1', [item.product_id]);
            const product = productRes.rows[0];
            totalWeight += (item.quantity * (product.weight_per_unit || 0));

            // Check Stock in Source Warehouse
            const stockRes = await query(
                'SELECT quantity FROM inventory WHERE product_id = $1 AND warehouse_id = $2',
                [item.product_id, warehouseId]
            );

            const available = stockRes.rows.length > 0 ? stockRes.rows[0].quantity : 0;
            if (available < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for Product ${item.product_id} in Warehouse ${warehouseId}. Available: ${available}`
                });
            }
        }

        // 2. Get Vehicle Capacity and Status
        const vehicleResult = await query('SELECT max_capacity, current_status FROM vehicles WHERE id = $1', [vehicleId]);
        if (vehicleResult.rows.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        const maxCapacity = parseFloat(vehicleResult.rows[0].max_capacity || 0);
        const currentStatus = vehicleResult.rows[0].current_status;

        if (currentStatus !== 'available') {
            return res.status(400).json({ error: `Vehicle is currently ${currentStatus} and cannot be assigned.` });
        }

        // 3. Validate Weight
        if (totalWeight > maxCapacity) {
            return res.status(400).json({
                error: `Vehicle capacity exceeded! Shipment Weight: ${totalWeight}kg, Vehicle Limit: ${maxCapacity}kg`
            });
        }

        // 4. Create Shipment
        const result = await query(
            `INSERT INTO shipments (order_id, vehicle_id, warehouse_id, departure_time, expected_arrival, status, items)
       VALUES ($1, $2, $3, $4, $5, 'in-transit', $6) RETURNING *`,
            [orderId, vehicleId, warehouseId, departureTime, expectedArrival, JSON.stringify(items)]
        );

        // 5. Deduct Inventory (Physical + Reservation)
        for (const item of items) {
            const shipQty = item.quantity;
            const productId = item.product_id;

            // A. Deduct Physical Quantity from Source Warehouse
            await query(
                `UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2 AND warehouse_id = $3`,
                [shipQty, productId, warehouseId]
            );


            let remainingReservationToDeduct = shipQty;

            // Step B1: Deduct from Source
            const sourceInv = await query(
                'SELECT reserved_quantity FROM inventory WHERE product_id = $1 AND warehouse_id = $2',
                [productId, warehouseId]
            );

            if (sourceInv.rows.length > 0) {
                const reservedAtSource = sourceInv.rows[0].reserved_quantity;
                const deductFromSource = Math.min(remainingReservationToDeduct, reservedAtSource);

                if (deductFromSource > 0) {
                    await query(
                        `UPDATE inventory SET reserved_quantity = reserved_quantity - $1 WHERE product_id = $2 AND warehouse_id = $3`,
                        [deductFromSource, productId, warehouseId]
                    );
                    remainingReservationToDeduct -= deductFromSource;
                }
            }

            // Step B2: Deduct from Others (if needed)
            if (remainingReservationToDeduct > 0) {
                // Find other warehouses with reservations for this product
                const otherReservations = await query(
                    `SELECT id, reserved_quantity FROM inventory 
                     WHERE product_id = $1 AND reserved_quantity > 0 AND warehouse_id != $2
                     ORDER BY reserved_quantity DESC`, // Take from biggest reservation first
                    [productId, warehouseId]
                );

                for (const row of otherReservations.rows) {
                    if (remainingReservationToDeduct <= 0) break;

                    const take = Math.min(remainingReservationToDeduct, row.reserved_quantity);

                    await query(
                        `UPDATE inventory SET reserved_quantity = reserved_quantity - $1 WHERE id = $2`,
                        [take, row.id]
                    );

                    remainingReservationToDeduct -= take;
                }
                if (remainingReservationToDeduct > 0) {
                    console.warn(`Shipment created but could not find full reservation to deduct for Product ${productId}. Missing: ${remainingReservationToDeduct}`);
                }
            }
        }

        // 6. Update Vehicle Status
        await query("UPDATE vehicles SET current_status = 'in-transit' WHERE id = $1", [vehicleId]);

        // 6.5 Update Driver Status
        const driverRes = await query('SELECT driver_id FROM vehicles WHERE id = $1', [vehicleId]);
        if (driverRes.rows.length > 0 && driverRes.rows[0].driver_id) {
            await query("UPDATE drivers SET status = 'on-trip' WHERE id = $1", [driverRes.rows[0].driver_id]);
        }

        // 7. Update Order Status
        // Calculate Total Shipped (including this one) vs Total Ordered
        const statusCheck = await query(`
            WITH ordered AS (
                SELECT SUM(quantity) as val FROM order_items WHERE order_id = $1
            ),
            shipped AS (
                SELECT SUM((elem->>'quantity')::int) as val 
                FROM shipments s, jsonb_array_elements(s.items) elem
                WHERE s.order_id = $1
            )
            SELECT o.val as ordered_qty, COALESCE(s.val, 0) as shipped_qty
            FROM ordered o
            LEFT JOIN shipped s ON true
        `, [orderId]);

        const { ordered_qty, shipped_qty } = statusCheck.rows[0];

        let newStatus = 'processing';
        if (parseInt(shipped_qty) >= parseInt(ordered_qty)) {
            newStatus = 'shipped';
        }

        await query("UPDATE orders SET status = $1 WHERE id = $2", [newStatus, orderId]);

        res.status(201).json({
            message: 'Shipment created successfully',
            shipment: result.rows[0],
            orderStatus: newStatus
        });
    } catch (error) {
        next(error);
    }
};

exports.updateShipment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { vehicleId, warehouseId, departureTime, expectedArrival, actualArrival, status } = req.body;

        let userId = req.user ? req.user.id : 1;

        // Verify user exists to prevent FK violation
        const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            console.warn(`User ID ${userId} from token not found in DB. Defaulting to admin (1).`);
            userId = 1;
        }

        // If status is being updated, use the Stored Procedure (Requirement C)
        if (status) {
            await query(
                `CALL update_shipment_status($1, $2, $3)`,
                [id, status, userId]
            );

            // SYNC: If shipment is delivered, update the order status as well
            if (status === 'delivered') {
                // Get order_id from shipment
                const shipmentRes = await query('SELECT order_id FROM shipments WHERE id = $1', [id]);
                if (shipmentRes.rows.length > 0) {
                    const orderId = shipmentRes.rows[0].order_id;

                    // Check if ALL items are delivered
                    const statusCheck = await query(`
                        WITH ordered AS (
                            SELECT SUM(quantity) as val FROM order_items WHERE order_id = $1
                        ),
                        delivered AS (
                            SELECT SUM((elem->>'quantity')::int) as val 
                            FROM shipments s, jsonb_array_elements(s.items) elem
                            WHERE s.order_id = $1 AND s.status = 'delivered'
                        )
                        SELECT o.val as ordered_qty, COALESCE(d.val, 0) as delivered_qty
                        FROM ordered o
                        LEFT JOIN delivered d ON true
                    `, [orderId]);

                    const { ordered_qty, delivered_qty } = statusCheck.rows[0];

                    if (parseInt(delivered_qty) >= parseInt(ordered_qty)) {
                        await query("UPDATE orders SET status = 'delivered' WHERE id = $1", [orderId]);
                        console.log(`✅ Synced Order #${orderId} status to 'delivered'`);
                    } else {
                        console.log(`ℹ️ Order #${orderId} partially delivered (${delivered_qty}/${ordered_qty}). Status remains processing/shipped.`);
                    }
                }
            }

            // SYNC: If delivered or cancelled, free up Vehicle and Driver
            if (status === 'delivered' || status === 'cancelled') {
                const shipmentVeh = await query('SELECT vehicle_id FROM shipments WHERE id = $1', [id]);
                if (shipmentVeh.rows.length > 0) {
                    const vId = shipmentVeh.rows[0].vehicle_id;
                    if (vId) {
                        await query("UPDATE vehicles SET current_status = 'available' WHERE id = $1", [vId]);
                        const dRes = await query('SELECT driver_id FROM vehicles WHERE id = $1', [vId]);
                        if (dRes.rows.length > 0 && dRes.rows[0].driver_id) {
                            await query("UPDATE drivers SET status = 'available' WHERE id = $1", [dRes.rows[0].driver_id]);
                        }
                    }
                }
            }
        }

        const otherFields = [vehicleId, warehouseId, departureTime, expectedArrival, actualArrival].some(f => f !== undefined);
        let result = { rows: [] };

        if (otherFields) {
            result = await query(
                `UPDATE shipments 
                 SET vehicle_id = COALESCE($1, vehicle_id),
                     warehouse_id = COALESCE($2, warehouse_id),
                     departure_time = COALESCE($3, departure_time),
                     expected_arrival = COALESCE($4, expected_arrival),
                     actual_arrival = COALESCE($5, actual_arrival)
                 WHERE id = $6 RETURNING *`,
                [vehicleId, warehouseId, departureTime, expectedArrival, actualArrival, id]
            );
        } else {
            // Fetch updated record if only status changed
            result = await query('SELECT * FROM shipments WHERE id = $1', [id]);
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        res.json({
            message: 'Shipment updated successfully',
            shipment: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteShipment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM shipments WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        res.json({
            message: 'Shipment deleted successfully',
            shipment: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};
