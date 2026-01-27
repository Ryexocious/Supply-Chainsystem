import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/orders';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const data = await ordersAPI.getOrderById(id);
            setOrder(data);
        } catch (err) {
            console.error('Fetch Order Error:', err);
            setError(err.message || 'Failed to fetch order details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f59e0b',
            processing: '#3b82f6',
            completed: '#10b981',
            delivered: '#10b981',
            cancelled: '#ef4444',
        };
        return colors[status] || '#6b7280';
    };

    if (loading) return <div className="page-container">Loading...</div>;
    if (error) return <div className="page-container"><div className="error-banner">{error}</div></div>;
    if (!order) return <div className="page-container">Order not found</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Order #{order.id}</h1>
                    <p className="page-subtitle">Created on {new Date(order.order_date).toLocaleDateString()}</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/orders')}>
                    ← Back to Orders
                </button>
            </div>

            <div className="page-header" style={{ marginTop: '0', paddingTop: '0', borderBottom: 'none' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {order.payment_status !== 'paid' && (
                        <button
                            className="btn-primary"
                            style={{ backgroundColor: '#10b981' }}
                            onClick={async () => {
                                if (window.confirm('Mark this order as PAID? This will update the customer\'s credit usage.')) {
                                    try {
                                        // Fix: Update payment_status, do NOT overwrite fulfillment status
                                        await ordersAPI.updateOrder(id, { payment_status: 'paid' });
                                        fetchOrder(); // Refresh details
                                    } catch (err) {
                                        alert('Failed to update status');
                                    }
                                }
                            }}
                        >
                            ✓ Mark as Paid
                        </button>
                    )}
                </div>
            </div>

            <div className="order-details-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div className="details-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3>Order Items</h3>
                    <table className="data-table" style={{ marginTop: '16px' }}>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(order.items) && order.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.product_name}</td>
                                    <td>{item.sku}</td>
                                    <td>{item.quantity}</td>
                                    <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                                    <td>${(item.quantity * item.unit_price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ marginTop: '24px', textAlign: 'right', fontSize: '1.25rem', fontWeight: 'bold' }}>
                        Total: ${parseFloat(order.total_amount).toFixed(2)}
                    </div>
                </div>

                <div className="details-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="info-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3>Customer Info</h3>
                        <p><strong>{order.company_name}</strong></p>
                        <p>{order.billing_address}</p>
                        <p>{order.customer_region}</p>
                    </div>

                    <div className="info-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3>Status</h3>
                        <span className="status-badge" style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            fontWeight: '500',
                            textTransform: 'capitalize',
                            backgroundColor: `${getStatusColor(order.status)}20`,
                            color: getStatusColor(order.status)
                        }}>
                            {order.status}
                        </span>

                        <h3 style={{ marginTop: '20px' }}>Payment</h3>
                        <span className="status-badge" style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            fontWeight: '500',
                            textTransform: 'capitalize',
                            backgroundColor: order.payment_status === 'paid' ? '#10b98120' : '#f59e0b20',
                            color: order.payment_status === 'paid' ? '#10b981' : '#f59e0b'
                        }}>
                            {order.payment_status || 'pending'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
