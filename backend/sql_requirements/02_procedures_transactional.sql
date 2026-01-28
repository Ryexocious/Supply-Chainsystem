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
    
    --. Stock ase kina check
    FOR item IN SELECT * FROM jsonb_array_elements(p_items_json)
    LOOP
        v_product_id := (item->>'product_id')::INT;
        v_qty := (item->>'quantity')::INT;

        SELECT SUM(quantity - reserved_quantity) INTO v_stock
        FROM inventory
        WHERE product_id = v_product_id;

        IF v_stock IS NULL OR v_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for Product ID %. Need %, Available %', v_product_id, v_qty, COALESCE(v_stock, 0);
        END IF;
    END LOOP;

    -- Order create
    INSERT INTO orders (customer_id, status)
    VALUES (p_customer_id, 'pending')
    RETURNING id INTO p_order_id;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items_json)
    LOOP
        v_product_id := (item->>'product_id')::INT;
        v_qty := (item->>'quantity')::INT;


        SELECT price INTO v_unit_price FROM products WHERE id = v_product_id;

        -- order_items table e insert
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (p_order_id, v_product_id, v_qty, v_unit_price);


        v_remaining_qty := v_qty;
        
        FOR v_inventory_record IN 
            SELECT id, quantity, reserved_quantity 
            FROM inventory 
            WHERE product_id = v_product_id 
              AND (quantity - reserved_quantity) > 0 
            ORDER BY (quantity - reserved_quantity) DESC 
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

    --total calculation
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

END;
$$;

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
    v_ordered_qty INT;
    v_delivered_qty INT;
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
        
        -- Sync Order Status (Check if ALL items are delivered)
        IF v_order_id IS NOT NULL THEN
            -- Calculate Total Ordered
            SELECT SUM(quantity) INTO v_ordered_qty FROM order_items WHERE order_id = v_order_id;
            
            -- Calculate Total Delivered (including this one, which is already updated above)
            SELECT COALESCE(SUM((elem->>'quantity')::int), 0) INTO v_delivered_qty
            FROM shipments s, jsonb_array_elements(s.items) elem
            WHERE s.order_id = v_order_id AND s.status = 'delivered';
            
            IF v_delivered_qty >= v_ordered_qty THEN
                UPDATE orders 
                SET status = 'delivered' 
                WHERE id = v_order_id;
            END IF;
        ELSE
            RAISE WARNING 'Shipment % has no associated Order ID', p_shipment_id;
        END IF;
    END IF;
    
    COMMIT;
END;
$$;