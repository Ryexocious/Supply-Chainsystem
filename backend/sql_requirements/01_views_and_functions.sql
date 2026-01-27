CREATE OR REPLACE VIEW v_RestockAlert AS
SELECT 
    p.id,
    p.name AS product_name,
    p.sku,
    p.category,
    COALESCE(SUM(i.quantity), 0) AS quantity,
    STRING_AGG(DISTINCT w.location_name, ', ') AS warehouse_name
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN warehouses w ON i.warehouse_id = w.id
GROUP BY p.id, p.name, p.sku, p.category
HAVING COALESCE(SUM(i.quantity), 0) < 50;