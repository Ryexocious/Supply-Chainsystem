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

CREATE OR REPLACE VIEW v_OrderFulfillmentStatus AS
SELECT 
    o.id AS order_id,
    c.company_name AS customer,
    o.order_date,
    o.status AS order_status,
    COUNT(oi.id) AS unique_items_count,
    o.total_amount,
    o.payment_status,
    s.status AS shipment_status,
    s.expected_arrival
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN shipments s ON o.id = s.order_id
GROUP BY o.id, c.company_name, o.order_date, o.status, o.payment_status, o.total_amount, s.status, s.expected_arrival;