import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import '../orders/OrderList.css'; // Reuse table styles

const ShipmentList = () => {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchShipments();
    }, []);

    const fetchShipments = async () => {
        setLoading(true);
        try {
            // Assuming shipmentController has getAllShipments endpoint at /shipments
            // If not, we might need to add it or use a specific query. 
            // In shipmentController.js we saw exports.getAllShipments mapped to GET /?
            // Need to verify routes. Assuming /shipments based on standard pattern.
            const response = await apiClient.get('/shipments');
            setShipments(response.data.shipments || []);
        } catch (err) {
            setError('Failed to fetch shipments');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f59e0b',
            'in-transit': '#3b82f6',
            delivered: '#10b981',
            cancelled: '#ef4444',
        };
        return colors[status] || '#6b7280';
    };

    if (loading) return <div className="page-container">Loading...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Shipments</h1>
                    <p className="page-subtitle">Track and manage active deliveries</p>
                </div>
                <div>
                    <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                        ← Back
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Shipment ID</th>
                            <th>Order Ref</th>
                            <th>Warehouse</th>
                            <th>Vehicle</th>
                            <th>Departure</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipments.map((shipment) => (
                            <tr key={shipment.id}>
                                <td className="font-medium">#{shipment.id}</td>
                                <td>#{shipment.order_ref || shipment.order_id}</td>
                                <td>{shipment.location_name || 'N/A'}</td>
                                <td>{shipment.license_plate || 'Unassigned'}</td>
                                <td>{shipment.departure_time ? new Date(shipment.departure_time).toLocaleDateString() : '-'}</td>
                                <td>
                                    <span
                                        className="status-badge"
                                        style={{
                                            backgroundColor: `${getStatusColor(shipment.status)}20`,
                                            color: getStatusColor(shipment.status),
                                        }}
                                    >
                                        {shipment.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-action" onClick={() => navigate(`/shipments/${shipment.id}`)}>
                                            View
                                        </button>
                                        {shipment.status !== 'delivered' && (
                                            <button
                                                className="btn-action"
                                                style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
                                                onClick={async () => {
                                                    if (window.confirm('Mark this shipment as Delivered?')) {
                                                        try {
                                                            await import('../../api/shipments').then(m => m.shipmentsAPI.updateShipment(shipment.id, { status: 'delivered' }));
                                                            fetchShipments();
                                                        } catch (e) {
                                                            alert('Failed to update status');
                                                        }
                                                    }
                                                }}
                                            >
                                                Delivered
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {shipments.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>
                                    No active shipments found. Create a shipment from the Orders page.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ShipmentList;
