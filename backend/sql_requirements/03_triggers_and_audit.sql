-- =============================================
-- Part 3: Triggers and Automation
-- =============================================

-- 1. BEFORE Trigger: Prevent Orders that exceed Credit Limit
CREATE OR REPLACE FUNCTION check_credit_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_credit_limit DECIMAL(12, 2);
    v_current_debt DECIMAL(12, 2);
BEGIN
    SELECT credit_limit INTO v_credit_limit FROM customers WHERE id = NEW.customer_id;
    
    -- Calculate unpaid orders
    SELECT COALESCE(SUM(total_amount), 0) INTO v_current_debt
    FROM orders
    WHERE customer_id = NEW.customer_id AND status NOT IN ('cancelled', 'paid');

    IF (v_current_debt + COALESCE(NEW.total_amount, 0)) > v_credit_limit THEN
        RAISE EXCEPTION 'Credit Limit Exceeded for Customer ID %', NEW.customer_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_credit_limit_before_order ON orders;
CREATE TRIGGER trg_check_credit_limit_before_order
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION check_credit_limit();

-- 3. Multi-row Trigger: Maintain Last Updated Timestamp (Moved from schema.sql)
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_inventory_timestamp ON inventory;
CREATE TRIGGER trg_update_inventory_timestamp
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_inventory_timestamp();
