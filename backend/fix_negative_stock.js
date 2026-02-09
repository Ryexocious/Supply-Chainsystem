require('dotenv').config();
const { Client } = require('pg');

const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

async function fixNegativeStock() {
    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Find invalid inventory items
        const res = await client.query(`
            SELECT id, product_id, warehouse_id, quantity, reserved_quantity 
            FROM inventory 
            WHERE reserved_quantity > quantity
        `);

        if (res.rows.length === 0) {
            console.log('✅ No invalid inventory records found. Stock data is healthy.');
            return;
        }

        console.log(`⚠️ Found ${res.rows.length} records with reserved_quantity > quantity.`);

        // 2. Fix them
        for (const item of res.rows) {
            console.log(`- Fixing Inventory # ${item.id} (Product ${item.product_id}, Warehouse ${item.warehouse_id}): Qty ${item.quantity}, Reserved ${item.reserved_quantity} -> Reseting Reserved to 0`);

            await client.query(`
                UPDATE inventory 
                SET reserved_quantity = 0 
                WHERE id = $1
            `, [item.id]);
        }

        console.log('✅ All invalid records have been corrected.');

    } catch (err) {
        console.error('❌ Error executing fix script:', err);
    } finally {
        await client.end();
    }
}

fixNegativeStock();
