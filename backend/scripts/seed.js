const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

console.log('🔌 Connecting to DB with URL...');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const seed = async () => {
    const client = await pool.connect();

    try {
        console.log('🌱 Starting seed process...');

        // 1. Clear existing data
        console.log('🧹 Clearing existing data...');
        // Order matters for Foreign Key constraints, but CASCADE handles "dependent" data.
        // We truncate main tables and let cascade clean up relations.
        await client.query(`
            TRUNCATE TABLE 
                users, 
                suppliers, 
                products, 
                product_suppliers,
                customers, 
                orders, 
                order_items, 
                warehouses, 
                inventory, 
                drivers, 
                vehicles, 
                shipments, 
                audit_logs
            RESTART IDENTITY CASCADE;
        `);

        // 2. Insert Users
        console.log('👤 Inserting Users...');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('password123', salt);

        const usersQuery = `
            INSERT INTO users (full_name, email, password, role) VALUES
            ('System Admin', 'admin@scm.com', $1, 'admin'),
            ('Logistics Manager', 'manager@scm.com', $1, 'manager'),
            ('John Driver', 'driver1@scm.com', $1, 'driver'),
            ('Jane Operator', 'operator@scm.com', $1, 'user')
            RETURNING id, role;
        `;
        const usersRes = await client.query(usersQuery, [hash]);
        // Map users for audit logs if needed (skipping strict audit linkage for seed simplicity, allowing NULL)

        // 3. Insert Suppliers
        console.log('🏭 Inserting Suppliers...');
        const suppliersQuery = `
            INSERT INTO suppliers (name, contact_email, phone) VALUES
            ('Global Tech Components', 'sales@globaltech.com', '+1-555-0101'),
            ('AutoParts Consolidated', 'orders@autoparts.com', '+1-555-0102'),
            ('Office Essentials Ltd', 'contact@officeessentials.com', '+1-555-0103'),
            ('Raw Materials Inc', 'supply@rawmaterials.com', '+1-555-0104'),
            ('MediCare Supplies', 'b2b@medicare.com', '+1-555-0105')
            RETURNING id;
        `;
        const suppliersRes = await client.query(suppliersQuery);

        // 4. Insert Products
        console.log('📦 Inserting Products...');
        const productsQuery = `
            INSERT INTO products (sku, name, category, price, weight_per_unit) VALUES
            ('ELEC-001', 'High-Performance Laptop', 'Electronics', 1200.00, 2.5),
            ('ELEC-002', 'Wireless Noise-Cancel Headphones', 'Electronics', 250.00, 0.8),
            ('ELEC-003', '4K Monitor 27-inch', 'Electronics', 350.00, 6.0),
            ('AUTO-001', 'Car Battery 12V', 'Automotive', 150.00, 15.0),
            ('AUTO-002', 'Synthetic Motor Oil 5L', 'Automotive', 45.00, 4.5),
            ('AUTO-003', 'All-Season Tire 17"', 'Automotive', 120.00, 10.0),
            ('OFF-001', 'Ergonomic Office Chair', 'Office', 200.00, 12.0),
            ('OFF-002', 'Standing Desk Frame', 'Office', 300.00, 25.0),
            ('MED-001', 'Surgical Masks (Box of 50)', 'Medical', 15.00, 0.2),
            ('MED-002', 'Nitrile Gloves (Box of 100)', 'Medical', 18.00, 0.5)
            RETURNING id;
        `;
        const productsRes = await client.query(productsQuery);

        // 5. Link Product Suppliers (Many-to-Many with price variant)
        console.log('🔗 Linking Products to Suppliers...');
        // Simplified mapping logic: just link sequentially for demo
        await client.query(`
            INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, supplier_price) 
            SELECT p.id, s.id, CONCAT('SUP-', p.sku), p.price * 0.8 
            FROM products p CROSS JOIN suppliers s 
            WHERE (p.id + s.id) % 2 = 0; -- Random distribution
        `);

        // 6. Insert Warehouses
        console.log('🏢 Inserting Warehouses...');
        const warehousesQuery = `
            INSERT INTO warehouses (location_name, address, max_capacity, type) VALUES
            ('Central Distribution Hub', '123 Logistics Way, New York, NY', 50000, 'Distribution Center'),
            ('West Coast Fulfillment', '456 Bay Area Blvd, San Francisco, CA', 30000, 'Fulfillment Center'),
            ('Europe Regional Depot', '789 Thames St, London, UK', 25000, 'Regional Depot'),
            ('Asia Pacific Storage', '101 Harbour View, Singapore', 40000, 'Cold Storage')
            RETURNING id;
        `;
        const warehousesRes = await client.query(warehousesQuery);

        // 7. Insert Inventory
        console.log('📦 Stocking Inventory...');
        // Add random stock to warehouses
        await client.query(`
            INSERT INTO inventory (warehouse_id, product_id, quantity, reserved_quantity)
            SELECT w.id, p.id, FLOOR(RANDOM() * 500) + 50, FLOOR(RANDOM() * 20)
            FROM warehouses w CROSS JOIN products p
            WHERE (w.id + p.id) % 3 != 0; -- Random distribution
        `);

        // 8. Insert Drivers
        console.log('🚚 Inserting Drivers...');
        const driversQuery = `
            INSERT INTO drivers (full_name, license_number, license_type, status) VALUES
            ('Michael Schumacher', 'LIC-0001', 'Heavy Truck', 'available'),
            ('Lewis Hamilton', 'LIC-0002', 'Heavy Truck', 'on-route'),
            ('Max Verstappen', 'LIC-0003', 'Van', 'available'),
            ('Ayrton Senna', 'LIC-0004', 'Heavy Truck', 'maintenance'),
            ('Sebastian Vettel', 'LIC-0005', 'Van', 'available')
            RETURNING id;
        `;
        const driversRes = await client.query(driversQuery);

        // 9. Insert Vehicles
        console.log('🚛 Inserting Vehicles...');
        await client.query(`
            INSERT INTO vehicles (driver_id, max_capacity, current_status, license_plate) VALUES
            (1, 10000, 'available', 'TRK-9001'),
            (2, 10000, 'in-transit', 'TRK-9002'),
            (3, 2000, 'available', 'VAN-2001'),
            (4, 12000, 'maintenance', 'TRK-9003'),
            (5, 2000, 'available', 'VAN-2002');
        `);

        // 10. Insert Customers
        console.log('👥 Inserting Customers...');
        const customersQuery = `
            INSERT INTO customers (company_name, email, phone, billing_address, region, credit_limit) VALUES
            ('Acme Corp', 'procurement@acme.com', '+1-555-1001', '100 Coyote Ln, Desert City', 'North America', 50000.00),
            ('Stark Industries', 'tony@stark.com', '+1-555-1002', '200 Malibu Point, CA', 'North America', 1000000.00),
            ('Wayne Enterprises', 'bruce@wayne.com', '+1-555-1003', '1007 Mountain Dr, Gotham', 'North America', 750000.00),
            ('Cyberdyne Systems', 'skynet@cyberdyne.com', '+1-555-1004', '800 Terminator Blvd, LA', 'North America', 250000.00),
            ('Massive Dynamic', 'william@massive.com', '+1-555-1005', '650 Bishop St, NY', 'North America', 400000.00)
            RETURNING id;
        `;
        const customersRes = await client.query(customersQuery);

        // 11. Insert Orders (Pending, Completed, etc.)
        console.log('📝 Inserting Orders...');
        // Order 1: Pending
        const val = await client.query(`SELECT id, price FROM products LIMIT 1`);
        const p1 = val.rows[0];

        const order1 = await client.query(`
            INSERT INTO orders (customer_id, total_amount, status, payment_status)
            VALUES (1, ${p1.price * 5}, 'pending', 'pending') RETURNING id;
        `);
        await client.query(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price)
            VALUES (${order1.rows[0].id}, ${p1.id}, 5, ${p1.price});
        `);

        // Order 2: Processing
        const order2 = await client.query(`
            INSERT INTO orders (customer_id, total_amount, status, payment_status)
            VALUES (2, 5000.00, 'processing', 'paid') RETURNING id;
        `);
        await client.query(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price)
            SELECT ${order2.rows[0].id}, id, 2, price FROM products LIMIT 3;
        `);

        // Order 3: Completed
        const order3 = await client.query(`
            INSERT INTO orders (customer_id, total_amount, status, payment_status)
            VALUES (3, 15000.00, 'completed', 'paid') RETURNING id;
        `);
        await client.query(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price)
            SELECT ${order3.rows[0].id}, id, 10, price FROM products WHERE category = 'Automotive' LIMIT 2;
        `);

        // 12. Insert Shipments
        console.log('🚚 Inserting Shipments...');
        await client.query(`
            INSERT INTO shipments (order_id, vehicle_id, warehouse_id, departure_time, expected_arrival, status)
            VALUES 
            (2, 2, 1, NOW(), NOW() + INTERVAL '2 days', 'in-transit'),
            (3, 1, 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', 'delivered');
        `);

        console.log('✅ Seed complete!');
    } catch (err) {
        console.error('❌ Seed failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
};

seed();
