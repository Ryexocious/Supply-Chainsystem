import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { shipmentsAPI } from '../../api/shipments';
import { ordersAPI } from '../../api/orders';
import apiClient from '../../api/client';
import '../orders/CreateOrder.css'; // Reuse form styles

const CreateShipment = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedOrderId = searchParams.get('orderId');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orders, setOrders] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [inventoryMap, setInventoryMap] = useState({}); // { productId: quantity }

    // Helper to get current local datetime string for input
    const getCurrentLocalDateTime = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localIso = new Date(now.getTime() - offset).toISOString().slice(0, 16);
        return localIso;
    };

    // Form State
    const [formData, setFormData] = useState({
        orderId: preselectedOrderId || '',
        vehicleId: '',
        departureTime: getCurrentLocalDateTime(),
        expectedArrival: ''
    });

    const [totalWeight, setTotalWeight] = useState(0);
    const [loadingWeight, setLoadingWeight] = useState(false);

    // Effect to fetch order details when order changes
    useEffect(() => {
        if (formData.orderId) {
            const fetchOrderDetails = async () => {
                setLoadingWeight(true);
                try {
                    const orderData = await ordersAPI.getOrderById(formData.orderId);
                    // Initialize items with shipQty = 0
                    const items = (orderData.items || []).map(item => {
                        const ordered = item.quantity;
                        const shipped = parseInt(item.quantity_shipped) || 0;
                        const remaining = Math.max(0, ordered - shipped);

                        return {
                            ...item,
                            shippedAlready: shipped,
                            remainingQty: remaining,
                            shipQty: remaining, // Default to remaining
                            weight: parseFloat(item.weight_per_unit) || 0
                        };
                    });
                    setOrderItems(items);
                } catch (err) {
                    console.error("Failed to fetch order details", err);
                } finally {
                    setLoadingWeight(false);
                }
            };
            fetchOrderDetails();
        } else {
            setOrderItems([]);
            setTotalWeight(0);
        }
    }, [formData.orderId]);

    // Effect to fetch inventory when Warehouse or Order changes
    useEffect(() => {
        if (formData.warehouseId && orderItems.length > 0) {
            const fetchInventory = async () => {
                try {
                    // Fetch all inventory for this warehouse
                    // Optimization: dedicated endpoint for specific products would be better, 
                    // but reusing getAllInventory?warehouseId=X is easiest.
                    const res = await apiClient.get(`/inventory?warehouseId=${formData.warehouseId}`);
                    const invList = res.data.inventory || [];
                    const map = {};
                    invList.forEach(i => {
                        map[i.product_id] = i.quantity;
                    });
                    setInventoryMap(map);
                } catch (err) {
                    console.error("Failed to fetch inventory", err);
                }
            };
            fetchInventory();
        } else {
            setInventoryMap({});
        }
    }, [formData.warehouseId, orderItems.length]);

    // Recalculate Weight based on Ship Qty
    useEffect(() => {
        const total = orderItems.reduce((sum, item) => {
            return sum + ((parseInt(item.shipQty) || 0) * item.weight);
        }, 0);
        setTotalWeight(total);
    }, [orderItems]);

    const handleQtyChange = (productId, qty) => {
        const newItems = orderItems.map(item => {
            if (item.product_id === productId) {
                return { ...item, shipQty: parseInt(qty) || 0 };
            }
            return item;
        });
        setOrderItems(newItems);
    };

    const getVehicleCapacity = (vId) => {
        const v = vehicles.find(veh => veh.id === parseInt(vId));
        return v ? v.max_capacity : 0;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Pending Orders
                // Note: ideally we filter backend side, but for now fetch recent/all
                const ordersRes = await ordersAPI.getAllOrders({ limit: 100, status: 'pending' });
                // Also fetch processing
                const processingRes = await ordersAPI.getAllOrders({ limit: 100, status: 'processing' });
                const combinedOrders = [...(ordersRes.orders || []), ...(processingRes.orders || [])];

                // Remove duplicates if any
                const uniqueOrders = Array.from(new Map(combinedOrders.map(item => [item.id, item])).values());
                setOrders(uniqueOrders);

                // Fetch Warehouses & Vehicles (assuming endpoints exist or mocking)
                // If endpoints don't exist, we'll mock them in state for now to unblock UI
                // Fetch Warehouses
                try {
                    const whRes = await apiClient.get('/warehouses');
                    const data = Array.isArray(whRes.data) ? whRes.data : (whRes.data.warehouses || []);
                    if (!data || data.length === 0) throw new Error('Empty');
                    setWarehouses(data);
                } catch (e) {
                    setWarehouses([
                        { id: 1, location_name: 'Main Distribution Center' },
                        { id: 2, location_name: 'East Coast Hub' }
                    ]);
                }

                // Fetch Vehicles
                try {
                    const vRes = await apiClient.get('/vehicles');
                    const data = Array.isArray(vRes.data) ? vRes.data : (vRes.data.vehicles || []);
                    if (!data || data.length === 0) throw new Error('Empty');
                    setVehicles(data);
                } catch (e) {
                    setVehicles([
                        { id: 1, license_plate: 'TRK-9823 (Truck)' },
                        { id: 2, license_plate: 'VAN-5521 (Van)' }
                    ]);
                }

            } catch (err) {
                console.error('Failed to load form data:', err);
                setError('Failed to load necessary data');
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Filter items with qty > 0
            const itemsToShip = orderItems
                .filter(i => i.shipQty > 0)
                .map(i => ({
                    product_id: i.product_id,
                    quantity: i.shipQty
                }));

            if (itemsToShip.length === 0) {
                throw new Error("Please enter quantity to ship for at least one item.");
            }

            // Client-side validation for stock
            for (const item of itemsToShip) {
                const available = inventoryMap[item.product_id] || 0;
                if (item.quantity > available) {
                    throw new Error(`Insufficient stock for Product ID ${item.product_id}. Available: ${available}, Requested: ${item.quantity}`);
                }
            }

            // Convert datetime-local strings (YYYY-MM-DDTHH:MM) to full ISO with timezone
            const payload = {
                ...formData,
                items: itemsToShip
            };

            if (payload.departureTime) {
                payload.departureTime = new Date(payload.departureTime).toISOString();
            }
            if (payload.expectedArrival) {
                payload.expectedArrival = new Date(payload.expectedArrival).toISOString();
            }

            await shipmentsAPI.createShipment(payload);
            navigate('/shipments');
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to create shipment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Create Shipment</h1>
                    <p className="page-subtitle">Dispatch an order</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/shipments')}>
                    Cancel
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="order-form-card">
                <div className="form-section">
                    <h3>Shipment Details</h3>

                    <div className="form-group">
                        <label>Select Order</label>
                        <select
                            className="form-control"
                            value={formData.orderId}
                            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                            required
                        >
                            <option value="">-- Select Order to Ship --</option>
                            {orders.map(o => (
                                <option key={o.id} value={o.id}>
                                    Order #{o.id} - {o.company_name} ({o.item_count} items)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Items Table */}
                    {formData.orderId && formData.warehouseId && orderItems.length > 0 && (
                        <div className="form-group">
                            <label>Items to Ship (from Selected Warehouse)</label>
                            <table className="table table-bordered" style={{ marginTop: '10px', fontSize: '0.9em' }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Ordered</th>
                                        <th>Shipped</th>
                                        <th>Remaining</th>
                                        <th>Available (Here)</th>
                                        <th style={{ width: '120px' }}>Ship Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderItems.map(item => {
                                        const available = inventoryMap[item.product_id] || 0;
                                        return (
                                            <tr key={item.id}>
                                                <td>{item.product_name || item.sku}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.shippedAlready}</td>
                                                <td>{item.remainingQty}</td>
                                                <td style={{ color: available < 1 ? 'red' : 'green', fontWeight: 'bold' }}>
                                                    {available}
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        min="0"
                                                        max={Math.min(item.remainingQty, available)} // Limit to remaining or available
                                                        value={item.shipQty}
                                                        onChange={(e) => handleQtyChange(item.product_id, e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Weight Calculation Display */}
                    {formData.orderId && (
                        <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>Shipment Weight Calculation</h4>
                            {loadingWeight ? (
                                <span>Calculating...</span>
                            ) : (
                                <div>
                                    <div><strong>Total Load:</strong> {totalWeight.toFixed(2)} kg</div>
                                    {formData.vehicleId && (
                                        <div style={{
                                            marginTop: '5px',
                                            color: totalWeight > getVehicleCapacity(formData.vehicleId) ? 'red' : 'green',
                                            fontWeight: 'bold'
                                        }}>
                                            Vehicle Capacity: {getVehicleCapacity(formData.vehicleId)} kg
                                            {totalWeight > getVehicleCapacity(formData.vehicleId) ? ' (Overloaded!)' : ' (OK)'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Warehouse (Origin)</label>
                        <select
                            className="form-control"
                            value={formData.warehouseId}
                            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                            required
                        >
                            <option value="">-- Select Warehouse --</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.location_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Assign Vehicle</label>
                        <select
                            className="form-control"
                            value={formData.vehicleId}
                            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                            required
                        >
                            <option value="">-- Select Vehicle --</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.license_plate}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Departure Time</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={formData.departureTime}
                                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Expected Arrival (Optional)</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={formData.expectedArrival}
                                onChange={(e) => setFormData({ ...formData, expectedArrival: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Shipment'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateShipment;
