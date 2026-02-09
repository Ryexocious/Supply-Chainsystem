const { query, pool } = require('../config/database');

exports.getAllSuppliers = async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM suppliers ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getSupplierById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM suppliers WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.createSupplier = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { name, contactEmail, phone, products } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        await client.query('BEGIN');

        // 1. Insert Supplier
        const supplierResult = await client.query(
            `INSERT INTO suppliers (name, contact_email, phone)
             VALUES ($1, $2, $3) RETURNING *`,
            [name, contactEmail, phone]
        );
        const newSupplier = supplierResult.rows[0];

        // 2. Insert Products if provided
        if (products && Array.isArray(products) && products.length > 0) {
            for (const product of products) {
                // Basic validation
                if (!product.sku || !product.price) {
                    throw new Error('Product SKU and Price are required for all items');
                }

                // Check if product exists
                const existingProductRes = await client.query(
                    'SELECT id FROM products WHERE sku = $1',
                    [product.sku]
                );

                let productId;

                if (existingProductRes.rows.length > 0) {
                    // LINK EXISTING
                    productId = existingProductRes.rows[0].id;
                } else {
                    // CREATE NEW
                    if (!product.name) {
                        throw new Error(`Product Name is required for new SKU: ${product.sku}`);
                    }
                    const newProductRes = await client.query(
                        `INSERT INTO products (sku, name, weight_per_unit, price, category)
                         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                        [
                            product.sku,
                            product.name,
                            product.weightPerUnit || 0,
                            product.price, // Default price
                            product.category
                        ]
                    );
                    productId = newProductRes.rows[0].id;
                }

                // Create Link in product_suppliers
                await client.query(
                    `INSERT INTO product_suppliers (product_id, supplier_id, supplier_price, supplier_sku)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (product_id, supplier_id) DO UPDATE 
                     SET supplier_price = EXCLUDED.supplier_price`,
                    [
                        productId,
                        newSupplier.id,
                        product.price, // Supplier specific price
                        product.sku    // Using SKU as supplier SKU for now
                    ]
                );
            }
        }

        await client.query('COMMIT');

        res.status(201).json(newSupplier);
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

exports.updateSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, contactEmail, phone } = req.body;

        const result = await query(
            `UPDATE suppliers
             SET name = COALESCE($1, name),
                 contact_email = COALESCE($2, contact_email),
                 phone = COALESCE($3, phone)
             WHERE id = $4 RETURNING *`,
            [name, contactEmail, phone, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.deleteSupplier = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        next(error);
    }
};
