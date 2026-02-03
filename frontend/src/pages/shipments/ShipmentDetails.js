import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shipmentsAPI } from '../../api/shipments';

const ShipmentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchShipment = async () => {
            try {
                const data = await shipmentsAPI.getShipmentById(id);
                setShipment(data.shipment);
            } catch (err) {
                setError('Failed to fetch shipment details');
            } finally {
                setLoading(false);
            }
        };
        fetchShipment();
    }, [id]);

    if (loading) return <div className="page-container">Loading...</div>;
    if (error) return <div className="page-container"><div className="error-banner">{error}</div></div>;
    if (!shipment) return <div className="page-container">Shipment not found</div>;

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f59e0b',
            'in-transit': '#3b82f6',
            delivered: '#10b981',
            cancelled: '#ef4444',
        };
        return colors[status] || '#6b7280';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Shipment #{shipment.id}</h1>
                    <p className="page-subtitle">For Order #{shipment.order_ref || shipment.order_id}</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/shipments')}>
                    ← Back to Shipments
                </button>
            </div>

            <div className="order-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="info-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3>Logistics Info</h3>
                    <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                        <div><strong>Warehouse:</strong> {shipment.location_name || 'N/A'}</div>
                        <div><strong>Vehicle:</strong> {shipment.license_plate || 'Unassigned'}</div>
                    </div>
                </div>

                <div className="info-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3>Timeline</h3>
                    <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                        <div><strong>Departure:</strong> {shipment.departure_time ? new Date(shipment.departure_time).toLocaleString() : '-'}</div>
                        <div><strong>Expected:</strong> {shipment.expected_arrival ? new Date(shipment.expected_arrival).toLocaleString() : '-'}</div>
                        <div><strong>Actual Arrival:</strong> {shipment.actual_arrival ? new Date(shipment.actual_arrival).toLocaleString() : 'Not yet arrived'}</div>
                    </div>
                </div>

                <div className="info-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3>Current Status</h3>
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="status-badge" style={{
                            padding: '8px 16px',
                            borderRadius: '9999px',
                            fontWeight: 'bold',
                            backgroundColor: `${getStatusColor(shipment.status)}20`,
                            color: getStatusColor(shipment.status)
                        }}>
                            {shipment.status.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShipmentDetails;
