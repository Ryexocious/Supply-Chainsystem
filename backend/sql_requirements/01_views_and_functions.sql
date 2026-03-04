-- =============================================
-- Part 1: Views and Stored Functions
-- =============================================

-- ---------------------------------------------
-- 1. Stored Functions (Requirement C: 3 Functions)
-- ---------------------------------------------

-- Function 1: Calculate Order Total (Used in Generated Columns or Reporting)
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

-- Function 2: Get Warehouse Utilization %
CREATE OR REPLACE FUNCTION get_warehouse_utilization(p_warehouse_id INT)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
    v_current_stock INT;
    v_max_capacity INT;
BEGIN
    -- Get Max Capacity
    SELECT max_capacity INTO v_max_capacity
    FROM warehouses
    WHERE id = p_warehouse_id;

    -- Get Current Stock
    SELECT COALESCE(SUM(quantity), 0) INTO v_current_stock
    FROM inventory
    WHERE warehouse_id = p_warehouse_id;

    -- Avoid Division by Zero
    IF v_max_capacity IS NULL OR v_max_capacity = 0 THEN
        RETURN 0.00;
    END IF;

    RETURN (v_current_stock::DECIMAL / v_max_capacity) * 100;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Predict Restock Date (Simple implementation based on avg sales)
-- Returns the date when stock is expected to hit 0 based on a mock daily sales rate
CREATE OR REPLACE FUNCTION predict_restock_date(p_product_id INT)
RETURNS DATE AS $$
DECLARE
    v_current_stock INT;
    v_avg_daily_sales DECIMAL(10, 2) := 2.5; -- Mock value for demonstration
    v_days_left INT;
BEGIN
    -- Get total stock across all warehouses
    SELECT COALESCE(SUM(quantity), 0) INTO v_current_stock
    FROM inventory
    WHERE product_id = p_product_id;

    IF v_current_stock = 0 THEN
        RETURN CURRENT_DATE;
    END IF;

    v_days_left := v_current_stock / v_avg_daily_sales;
    
    RETURN CURRENT_DATE + (v_days_left || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- 2. Views (Requirement B: 2 Views)
-- ---------------------------------------------

-- View 1: Restock Alert
-- Shows products that need restocking (Logic: Stock < 50 units)
DROP VIEW IF EXISTS v_RestockAlert CASCADE;
CREATE OR REPLACE VIEW v_RestockAlert AS
SELECT 
    p.sku,
    p.name AS product_name,
    STRING_AGG(DISTINCT s.name, ', ') AS supplier_name,
    COALESCE(SUM(i.quantity), 0) AS total_quantity,
    p.category
FROM products p
JOIN inventory i ON p.id = i.product_id
LEFT JOIN product_suppliers ps ON p.id = ps.product_id
LEFT JOIN suppliers s ON ps.supplier_id = s.id
GROUP BY p.id, p.sku, p.name, p.category
HAVING COALESCE(SUM(i.quantity), 0) < 50;

-- View 2: Order Fulfillment Status
-- Combines Order info using the new schema
DROP VIEW IF EXISTS v_OrderFulfillmentStatus CASCADE;
CREATE OR REPLACE VIEW v_OrderFulfillmentStatus AS
SELECT 
    o.id AS order_id,
    c.company_name AS customer,
    o.order_date,
    o.status AS order_status,
    COUNT(oi.id) AS unique_items_count,
    o.total_amount,
    s.status AS shipment_status,
    s.expected_arrival
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN shipments s ON o.id = s.order_id
GROUP BY o.id, c.company_name, o.order_date, o.status, o.total_amount, s.status, s.expected_arrival;
