const axios = require('axios');
const { Client } = require('pg');

// Database configuration
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'Supplychainsystem',
    password: 'root',
    port: 5432,
};

const API_URL = 'http://localhost:5000/api'; // Adjust port if needed

async function runVerification() {
    const client = new Client(dbConfig);
    await client.connect();

    try {
        console.log('--- Starting Verification ---');

        // 1. Create a Test Customer
        console.log('Creating Test Customer...');
        const custRes = await client.query(`
            INSERT INTO customers (company_name, contact_name, email, phone, address, tax_id, payment_terms, credit_limit)
            VALUES ('Test Company', 'Test Contact', 'test@example.com', '1234567890', '123 Test St', 'TAX123', 'net30', 10000)
            RETURNING id
        `);
        const customerId = custRes.rows[0].id;
        console.log(`Customer Created: ${customerId}`);

        // 2. Create Test Products
        console.log('Creating Test Products...');
        const prod1Res = await client.query(`
            INSERT INTO products (name, sku, category, weight_per_unit, price, supplier_id, description)
            VALUES ('Product A', 'SKU-A', 'Test', 1.0, 10.0, 1, 'Test Product A')
            RETURNING id
        `);
        const prod1Id = prod1Res.rows[0].id;

        const prod2Res = await client.query(`
            INSERT INTO products (name, sku, category, weight_per_unit, price, supplier_id, description)
            VALUES ('Product B', 'SKU-B', 'Test', 2.0, 20.0, 1, 'Test Product B')
            RETURNING id
        `);
        const prod2Id = prod2Res.rows[0].id;
        console.log(`Products Created: ${prod1Id}, ${prod2Id}`);

        // 3. Create Warehouse and Inventory
        console.log('Creating Warehouse and Inventory...');
        const whRes = await client.query(`
            INSERT INTO warehouses (location_name, address, capacity, manager_name)
            VALUES ('Test Warehouse', '456 Warehouse Blvd', 1000, 'Manager Bob')
            RETURNING id
        `);
        const warehouseId = whRes.rows[0].id;

        await client.query(`
            INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, min_stock_level)
            VALUES ($1, $3, 100, 0, 10), ($2, $3, 100, 0, 10)
        `, [prod1Id, prod2Id, warehouseId]);
        console.log(`Inventory Added to Warehouse ${warehouseId}`);

        // 4. Create Vehicle (for shipping)
        const vehRes = await client.query(`
            INSERT INTO vehicles (license_plate, type, max_capacity, current_status, driver_id)
            VALUES ('TEST-VAN', 'Van', 1000, 'available', NULL)
            RETURNING id
        `);
        const vehicleId = vehRes.rows[0].id;

        // 5. Create Order
        console.log('Creating Order via API...');
        // We use direct DB insert for speed if API auth is complex, but API simulates real flow better.
        // Let's use DB stored procedure directly to avoid AUTH middleware issues in script
        const items = JSON.stringify([
            { product_id: prod1Id, quantity: 5 },
            { product_id: prod2Id, quantity: 5 }
        ]);
        const orderRes = await client.query(`CALL place_order($1, $2, $3)`, [customerId, items, null]);
        // output parameter handling in node-postgres is tricky with CALL, usually it returns void or we need to capture output.
        // Let's just grab the latest order for this customer
        const orderIdRes = await client.query('SELECT id FROM orders WHERE customer_id = $1 ORDER BY id DESC LIMIT 1', [customerId]);
        const orderId = orderIdRes.rows[0].id;
        console.log(`Order Created: ${orderId}`);


        // 6. Ship Product A (Partial Shipment)
        console.log('Creating Shipment for Product A...');
        const shipmentItems = JSON.stringify([{ product_id: prod1Id, quantity: 5 }]);
        const shipmentRes = await client.query(`
            INSERT INTO shipments (order_id, vehicle_id, warehouse_id, departure_time, expected_arrival, status, items)
            VALUES ($1, $2, $3, NOW(), NOW(), 'in-transit', $4)
            RETURNING id
        `, [orderId, vehicleId, warehouseId, shipmentItems]);
        const shipmentId = shipmentRes.rows[0].id;
        console.log(`Shipment Created: ${shipmentId}`);

        // 7. Verify Order Details (The Logic Check)
        console.log('Checking Order Details via Query (simulating getOrderById)...');

        // This is the query from orderController.js
        const queryText = `
            WITH shipped_items AS(
                SELECT 
                    s.order_id,
                elem ->> 'product_id' as product_id,
                SUM((elem ->> 'quantity'):: int) as shipped_qty
                FROM shipments s,
                jsonb_array_elements(s.items) elem
                WHERE s.order_id = $1 AND s.status != 'cancelled'
                GROUP BY s.order_id, elem ->> 'product_id'
            )
        SELECT
        oi.*,
            p.name as product_name,
            COALESCE(si.shipped_qty, 0) as quantity_shipped
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN shipped_items si ON oi.order_id = si.order_id 
                                       AND oi.product_id = (si.product_id):: int
            WHERE oi.order_id = $1
        `;

        const checkRes = await client.query(queryText, [orderId]);

        console.log('\n--- Results ---');
        checkRes.rows.forEach(row => {
            console.log(`Product: ${row.product_name}, Ordered: ${row.quantity}, Shipped: ${row.quantity_shipped}`);
            if (row.product_id === prod1Id && parseInt(row.quantity_shipped) !== 5) {
                console.error('FAIL: Product A should have 5 shipped');
            }
            if (row.product_id === prod2Id && parseInt(row.quantity_shipped) !== 0) {
                console.error('FAIL: Product B should have 0 shipped');
            }
        });

        // Cleanup
        console.log('\nCleaning up...');
        await client.query('DELETE FROM shipments WHERE id = $1', [shipmentId]);
        // Release reservations first if needed, but we are deleting order items anyway
        // Need to check FK constraints. order_items cascades on delete order? Assuming yes or handled.
        // Actually, trigger might update inventory, but we are manually deleting inventory too.
        await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
        await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
        await client.query('DELETE FROM inventory WHERE warehouse_id = $1', [warehouseId]);
        await client.query('DELETE FROM warehouses WHERE id = $1', [warehouseId]);
        await client.query('DELETE FROM products WHERE id IN ($1, $2)', [prod1Id, prod2Id]);
        await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
        await client.query('DELETE FROM vehicles WHERE id = $1', [vehicleId]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

runVerification();
