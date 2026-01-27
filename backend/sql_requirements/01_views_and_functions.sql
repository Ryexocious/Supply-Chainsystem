CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id INT)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    v_total DECIMAL(12, 2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0)
    INTO v_total
    FROM order_items
    WHERE order_id = p_order_id;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;



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