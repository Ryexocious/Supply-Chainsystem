-- =============================================
-- Part 2: Stored Procedures (Transactional)
-- =============================================

-- Procedure 1: Place Order (Complex Transaction)
-- Handles: Stock Check, Order Creation, Item Insertion, Inventory Deduction
CREATE OR REPLACE PROCEDURE place_order(
    p_customer_id INT,
    p_items_json JSONB, -- Array of objects: [{"product_id": 1, "quantity": 5}, ...]
    INOUT p_order_id INT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    item JSONB;
    v_product_id INT;
    v_qty INT;
    v_stock INT;
    v_unit_price DECIMAL(10, 2);
    v_total_amount DECIMAL(12, 2) := 0;
    v_remaining_qty INT;
    v_inventory_record RECORD;
BEGIN
    -- 1. Start Transaction works automatically in Procedures (Call with CALL)
    
    -- 2. Validate Stock Availability FIRST (Fail fast)
    FOR item IN SELECT * FROM jsonb_array_elements(p_items_json)
    LOOP
        v_product_id := (item->>'product_id')::INT;
        v_qty := (item->>'quantity')::INT;

        SELECT SUM(quantity) INTO v_stock
        FROM inventory
        WHERE product_id = v_product_id;

        IF v_stock IS NULL OR v_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for Product ID %', v_product_id;
        END IF;
    END LOOP;

    -- 3. Create Order Header
    INSERT INTO orders (customer_id, status)
    VALUES (p_customer_id, 'pending')
    RETURNING id INTO p_order_id;

    -- 4. Process Items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items_json)
    LOOP
        v_product_id := (item->>'product_id')::INT;
        v_qty := (item->>'quantity')::INT;

        -- Get Price
        SELECT price INTO v_unit_price FROM products WHERE id = v_product_id;

        -- Insert Order Item (Standard)
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (p_order_id, v_product_id, v_qty, v_unit_price);

        -- Deduct Inventory (RESERVATION LOGIC)
        -- We do NOT decrement 'quantity' (Physical). We increment 'reserved_quantity'.
        v_remaining_qty := v_qty;
        
        FOR v_inventory_record IN 
            SELECT id, quantity, reserved_quantity 
            FROM inventory 
            WHERE product_id = v_product_id 
              AND (quantity - reserved_quantity) > 0 
            ORDER BY (quantity - reserved_quantity) DESC -- Take from most available
            FOR UPDATE
        LOOP
            EXIT WHEN v_remaining_qty <= 0;
            
            DECLARE
                v_available INT := v_inventory_record.quantity - v_inventory_record.reserved_quantity;
                v_take INT;
            BEGIN
                v_take := LEAST(v_remaining_qty, v_available);
                
                UPDATE inventory 
                SET reserved_quantity = reserved_quantity + v_take,
                    last_updated = NOW()
                WHERE id = v_inventory_record.id;
                
                v_remaining_qty := v_remaining_qty - v_take;
            END;
        END LOOP;

        IF v_remaining_qty > 0 THEN
            RAISE EXCEPTION 'Insufficient stock for Product ID % (Need %, Available %)', v_product_id, v_qty, (v_qty - v_remaining_qty);
        END IF;
    END LOOP;

    -- 5. Update Order Total using Function (Requirement)
    UPDATE orders 
    SET total_amount = calculate_order_total(p_order_id) 
    WHERE id = p_order_id;
    
    -- 6. Check Credit Limit
    DECLARE
        v_credit_limit DECIMAL(12, 2);
        v_current_debt DECIMAL(12, 2);
    BEGIN
        SELECT credit_limit INTO v_credit_limit FROM customers WHERE id = p_customer_id;
        
        -- Calculate unpaid orders
        SELECT COALESCE(SUM(total_amount), 0) INTO v_current_debt
        FROM orders
        WHERE customer_id = p_customer_id AND status NOT IN ('cancelled', 'paid');
        
        IF v_current_debt > v_credit_limit THEN
            RAISE EXCEPTION 'Credit Limit Exceeded. Limit: %, Current Debt: %', v_credit_limit, v_current_debt;
        END IF;
    END;

    -- Transaction is managed by the caller
END;
$$;

    -- Procedure 2: Update Shipment Status
CREATE OR REPLACE PROCEDURE update_shipment_status(
    p_shipment_id INT,
    p_status VARCHAR,
    p_user_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_vehicle_id INT;
    v_order_id INT;
BEGIN
    -- Update Shipment and capture vehicle_id AND order_id
    UPDATE shipments 
    SET status = p_status, 
        actual_arrival = (CASE WHEN TRIM(LOWER(p_status)) = 'delivered' THEN NOW() ELSE NULL END)
    WHERE id = p_shipment_id
    RETURNING vehicle_id, order_id INTO v_vehicle_id, v_order_id;

    -- Audit Log
    INSERT INTO audit_logs (table_name, action_type, record_id, changed_by, new_data)
    VALUES ('shipments', 'UPDATE', p_shipment_id, p_user_id, jsonb_build_object('status', p_status));

    -- Logic for 'delivered' status
    IF TRIM(LOWER(p_status)) = 'delivered' THEN
        -- Free up vehicle
        IF v_vehicle_id IS NOT NULL THEN
            UPDATE vehicles SET current_status = 'available' WHERE id = v_vehicle_id;
        END IF;
        
        -- Sync Order Status
        IF v_order_id IS NOT NULL THEN
            DECLARE
                v_ordered_qty INT;
                v_delivered_qty INT;
            BEGIN
                SELECT COALESCE(SUM(quantity), 0) INTO v_ordered_qty FROM order_items WHERE order_id = v_order_id;
                
                SELECT COALESCE(SUM((elem->>'quantity')::int), 0) INTO v_delivered_qty
                FROM shipments s, jsonb_array_elements(s.items) elem
                WHERE s.order_id = v_order_id AND s.status = 'delivered';

                IF v_delivered_qty >= v_ordered_qty THEN
                    UPDATE orders SET status = 'delivered' WHERE id = v_order_id;
                END IF;
            END;
        ELSE
            RAISE WARNING 'Shipment % has no associated Order ID', p_shipment_id;
        END IF;
    END IF;
    
    COMMIT;
END;
$$;

-- Procedure 3: Bulk Monthly Invoice Generation
-- Requirement: Bulk Operation / Cursor
CREATE OR REPLACE PROCEDURE generate_monthly_invoices()
LANGUAGE plpgsql
AS $$
DECLARE
    customer_cursor CURSOR FOR 
        SELECT id, company_name FROM customers; /* WHERE credit_limit > 0 */
    
    v_customer_id INT;
    v_company_name VARCHAR;
    v_total_due DECIMAL(12, 2);
BEGIN
    OPEN customer_cursor;
    
    LOOP
        FETCH customer_cursor INTO v_customer_id, v_company_name;
        EXIT WHEN NOT FOUND;

        -- Calculate due amount for this month's orders
        SELECT SUM(total_amount) INTO v_total_due
        FROM orders
        WHERE customer_id = v_customer_id 
          AND order_date >= date_trunc('month', CURRENT_DATE)
          AND status IN ('shipped', 'delivered'); -- Only bill shipped/delivered orders

        IF v_total_due > 0 THEN
            -- Ideally insert into an 'Invoices' table. For now, we log it.
            RAISE NOTICE 'Generated Invoice for %: $%', v_company_name, v_total_due;
        END IF;
    END LOOP;
    
    CLOSE customer_cursor;
END;
$$;
