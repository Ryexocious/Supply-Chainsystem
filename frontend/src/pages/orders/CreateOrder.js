import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/orders';
import { productsAPI } from '../../api/products';
import apiClient from '../../api/client';
import './CreateOrder.css';

const CreateOrder = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    // Form State
    const [customerId, setCustomerId] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([
        { productId: '', quantity: 1, price: 0, warehouseId: '', stockData: [], filterTerm: '' }
    ]);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [productsData, customersRes] = await Promise.all([
                    productsAPI.getAllProducts({ limit: 100 }),
                    apiClient.get('/customers')
                ]);

                setProducts(productsData.products || []);
                setCustomers(customersRes.data.customers || []);
            } catch (err) {
                console.error('Failed to load data:', err);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const total = selectedProducts.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        setTotalAmount(total);
    }, [selectedProducts]);



    const handleProductChange = async (index, productId) => {
        const product = products.find(p => p.id === parseInt(productId));
        const newItems = [...selectedProducts];

        // Reset row
        newItems[index] = {
            ...newItems[index],
            productId: productId,
            price: product ? parseFloat(product.price) : 0,
            warehouseId: '',
            stockData: []
        };

        if (productId) {
            try {
                const res = await apiClient.get(`/inventory/product/${productId}`);
                newItems[index].stockData = res.data.stock || [];
            } catch (err) {
                console.error("Failed to fetch stock", err);
            }
        }

        setSelectedProducts(newItems);
    };

    const handleWarehouseChange = (index, warehouseId) => {
        const newItems = [...selectedProducts];
        newItems[index].warehouseId = warehouseId;
        setSelectedProducts(newItems);
    };

    const handleQuantityChange = (index, qty) => {
        const newItems = [...selectedProducts];
        newItems[index].quantity = parseInt(qty) || 1;
        setSelectedProducts(newItems);
    };

    const handleFilterChange = (index, term) => {
        const newItems = [...selectedProducts];
        newItems[index].filterTerm = term;
        setSelectedProducts(newItems);
    };

    const addProductRow = () => {
        setSelectedProducts([...selectedProducts, { productId: '', quantity: 1, price: 0, warehouseId: '', stockData: [], filterTerm: '' }]);
    };

    const removeProductRow = (index) => {
        if (selectedProducts.length > 1) {
            setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!customerId) {
            setError('Please select a customer');
            setLoading(false);
            return;
        }

        try {
            const orderData = {
                customerId,
                items: selectedProducts.map(item => ({
                    product_id: item.productId,
                    quantity: item.quantity,
                    warehouse_id: item.warehouseId || null
                })),
                totalAmount
            };

            await ordersAPI.createOrder(orderData);
            navigate('/orders');
        } catch (err) {
            setError(err.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container create-order-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Create New Order</h1>
                    <p className="page-subtitle">Enter order details below</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/orders')}>
                    Cancel
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="order-form-card">
                <div className="form-section">
                    <h3>Customer Details</h3>
                    <div className="form-group">
                        <label>Select Customer</label>
                        <select
                            className="form-control"
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            required
                        >
                            <option value="">-- Select Customer --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.company_name} ({c.email})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Order Items</h3>
                    {selectedProducts.map((item, index) => (
                        <div key={index} className="product-selection-row">
                            <div className="product-select">
                                <label>Product</label>
                                {/* Search/Filter Input */}
                                <input
                                    type="text"
                                    placeholder="Filter by Name, SKU, or ID..."
                                    className="filter-input"
                                    style={{ marginBottom: '5px', width: '100%', padding: '5px' }}
                                    onChange={(e) => {
                                        const term = e.target.value.toLowerCase();
                                        // We can use a local state to filter the list if we wanted to make it custom,
                                        // but for simplicity, let's just use the native select filter or a searchable solution.
                                        // Actually, HTML select doesn't support search easily. 
                                        // Let's implement a rudimentary searchable select:
                                        // 1. We keep a 'filterTerm' state for each row? Or just a global one? No, per row.
                                        // This is getting complex for standard HTML.

                                        // Simpler approach: Allow user to type to filter the OPTIONS visible in the dropdown.
                                        // But modifying options dynamically runs into state issues.

                                        // Better approach: React Select or similar library is ideal, but sticking to no-deps:
                                        // Filter the list *before* mapping to options.
                                        // We need a 'filter' property on the selectedProduct state items.
                                        handleFilterChange(index, term);
                                    }}
                                />
                                <select
                                    value={item.productId}
                                    onChange={(e) => handleProductChange(index, e.target.value)}
                                    required
                                    className="form-control"
                                >
                                    <option value="">Select Product...</option>
                                    {(item.filterTerm ?
                                        products.filter(p =>
                                            p.name.toLowerCase().includes(item.filterTerm) ||
                                            p.sku.toLowerCase().includes(item.filterTerm) ||
                                            String(p.id).includes(item.filterTerm)
                                        ) : products
                                    ).map(p => (
                                        <option key={p.id} value={p.id}>
                                            #{p.id} [SKU: {p.sku}] - {p.name} (${p.price})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="quantity-input">
                                <label>Qty</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                    required
                                />
                            </div>
                            <div className="item-total">
                                <label>Total</label>
                                <div>${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                            {selectedProducts.length > 1 && (
                                <button
                                    type="button"
                                    className="btn-remove"
                                    onClick={() => removeProductRow(index)}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}

                    <button type="button" className="btn-add-product" onClick={addProductRow}>
                        + Add Another Product
                    </button>
                </div>

                <div className="order-summary">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Tax (0%)</span>
                        <span>$0.00</span>
                    </div>
                    <div className="summary-total">
                        <span>Total Amount</span>
                        <span>${totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating Order...' : 'Place Order'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateOrder;
