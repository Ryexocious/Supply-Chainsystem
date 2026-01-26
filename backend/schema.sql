-- Enable UUID extension if needed (good for distributed systems like Supabase, but sticking to SERIAL for now to match current logic)

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    phone VARCHAR(50)
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    weight_per_unit DECIMAL(10, 2),
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100)
);

CREATE TABLE product_suppliers (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    supplier_id INT REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_sku VARCHAR(100),
    supplier_price DECIMAL(10, 2),
    UNIQUE(product_id, supplier_id)
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    billing_address TEXT,
    region VARCHAR(100),
    credit_limit DECIMAL(12, 2)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL,
    address TEXT,
    max_capacity INT NOT NULL,
    type VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    warehouse_id INT REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, product_id)
);

CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'available'
);

CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    driver_id INT REFERENCES drivers(id) ON DELETE SET NULL,
    max_capacity INT NOT NULL,
    current_status VARCHAR(50) DEFAULT 'available',
    license_plate VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    vehicle_id INT REFERENCES vehicles(id) ON DELETE SET NULL,
    warehouse_id INT REFERENCES warehouses(id) ON DELETE SET NULL,
    departure_time TIMESTAMP,
    expected_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    items JSONB, -- Stores array of shipped items: [{"product_id": 1, "quantity": 5}]
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    record_id INT,
    old_data JSONB,
    new_data JSONB,
    changed_by INT REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_orders_customer_id ON orders(customer_id);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);


