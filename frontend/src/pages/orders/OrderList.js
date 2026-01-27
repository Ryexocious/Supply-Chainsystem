import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/orders';
import './OrderList.css';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await ordersAPI.getAllOrders({ page, limit: 10 });
            setOrders(data.orders);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            setError(err.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

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

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Orders</h1>
                    <p className="page-subtitle">Manage all your orders</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => navigate('/orders/new')}>
                        + New Order
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td className="font-medium">#{order.id}</td>
                                <td>{order.company_name || 'N/A'}</td>
                                <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                <td>{order.item_count}</td>
                                <td className="font-medium">
                                    ${parseFloat(order.total_amount).toFixed(2)}
                                </td>
                                <td>
                                    <span
                                        className="status-badge"
                                        style={{
                                            backgroundColor: `${getStatusColor(order.status)}20`,
                                            color: getStatusColor(order.status),
                                        }}
                                    >
                                        {order.status}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        className="status-badge"
                                        style={{
                                            backgroundColor: order.payment_status === 'paid' ? '#10b98120' : '#f59e0b20',
                                            color: order.payment_status === 'paid' ? '#10b981' : '#f59e0b',
                                        }}
                                    >
                                        {order.payment_status || 'pending'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-action" onClick={() => navigate(`/orders/${order.id}`)}>
                                            View
                                        </button>
                                        {['pending', 'processing'].includes(order.status) && (
                                            <button
                                                className="btn-action"
                                                style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none' }}
                                                onClick={() => navigate(`/shipments/new?orderId=${order.id}`)}
                                            >
                                                Ship
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="btn-pagination"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span className="pagination-info">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        className="btn-pagination"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrderList;
