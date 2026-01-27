const { query, pool } = require('../config/database');

exports.getAllProducts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, category, supplierId } = req.query;
        const offset = (page - 1) * limit;

        let queryText = `
            SELECT p.*,
                   COALESCE(MAX(stock.total_quantity), 0) as total_stock,
                   STRING_AGG(DISTINCT s.name, ', ') as supplier_names,
                   JSON_AGG(DISTINCT ps.supplier_id) as supplier_ids
            FROM products p
            LEFT JOIN product_suppliers ps ON p.id = ps.product_id
            LEFT JOIN suppliers s ON ps.supplier_id = s.id
            LEFT JOIN (
                SELECT product_id, SUM(quantity - reserved_quantity) as total_quantity
                FROM inventory
                GROUP BY product_id
            ) stock ON p.id = stock.product_id
            WHERE 1=1
        `;
        const queryParams = [];
        let paramCount = 1;

        if (category) {
            queryText += ` AND p.category = $${paramCount}`;
            queryParams.push(category);
            paramCount++;
        }

        if (supplierId) {
            queryText += ` AND ps.supplier_id = $${paramCount}`;
            queryParams.push(supplierId);
            paramCount++;
        }

        queryText += ` GROUP BY p.id ORDER BY p.name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        // Get total count
        const countResult = await query('SELECT COUNT(*) FROM products');
        const totalCount = parseInt(countResult.rows[0].count);

        res.json({
            products: result.rows,
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

exports.getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT p.*,
                   json_agg(json_build_object(
                       'supplier_id', s.id,
                       'name', s.name,
                       'price', ps.supplier_price,
                       'sku', ps.supplier_sku
                   )) as suppliers
            FROM products p
            LEFT JOIN product_suppliers ps ON p.id = ps.product_id
            LEFT JOIN suppliers s ON ps.supplier_id = s.id
            WHERE p.id = $1
            GROUP BY p.id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.createProduct = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { supplierId, sku, name, weightPerUnit, price, category } = req.body;

        if (!name || !sku || !price) {
            return res.status(400).json({ error: 'Name, SKU, and Price are required' });
        }

        await client.query('BEGIN');

        // 1. Create Base Product
        const productResult = await client.query(
            `INSERT INTO products (sku, name, weight_per_unit, price, category)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [sku, name, weightPerUnit, price, category]
        );
        const newProduct = productResult.rows[0];

        // 2. Link Supplier if provided
        if (supplierId) {
            await client.query(
                `INSERT INTO product_suppliers (product_id, supplier_id, supplier_price)
                 VALUES ($1, $2, $3)`,
                [newProduct.id, supplierId, price]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(newProduct);
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') { // Unique constraint
            return res.status(400).json({ error: 'SKU already exists' });
        }
        next(error);
    } finally {
        client.release();
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { supplierId, sku, name, weightPerUnit, price, category } = req.body;

        const result = await query(
            `UPDATE products
             SET supplier_id = COALESCE($1, supplier_id),
                 sku = COALESCE($2, sku),
                 name = COALESCE($3, name),
                 weight_per_unit = COALESCE($4, weight_per_unit),
                 price = COALESCE($5, price),
                 category = COALESCE($6, category)
             WHERE id = $7 RETURNING *`,
            [supplierId, sku, name, weightPerUnit, price, category, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.getCategories = async (req, res, next) => {
    try {
        const result = await query(`
            SELECT category, COUNT(*) as product_count 
            FROM products 
            WHERE category IS NOT NULL 
            GROUP BY category 
            ORDER BY category
        `);
        res.json({ categories: result.rows });
    } catch (error) {
        next(error);
    }
};
