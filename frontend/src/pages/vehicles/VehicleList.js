import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Layout from '../../components/layout/Layout';
import '../../pages/dashboard/Dashboard.css';

const VehicleList = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await apiClient.get('/vehicles');
            setVehicles(response.data.vehicles || []);
        } catch (err) {
            setError('Failed to fetch vehicles');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        return status === 'available' ? '#10b981' : '#f59e0b';
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Vehicles</h1>
                    <p className="page-subtitle">Manage your fleet</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => navigate('/vehicles/new')}>
                        + Add Vehicle
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : error ? (
                <div style={{ color: 'red', padding: '20px' }}>{error}</div>
            ) : (
                <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <tr>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>License Plate</th>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Driver</th>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Capacity</th>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map((vehicle) => (
                                <tr key={vehicle.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ fontWeight: '500' }}>{vehicle.license_plate}</span>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>{vehicle.driver_name || 'Unassigned'}</td>
                                    <td style={{ padding: '16px 24px' }}>{vehicle.max_capacity} kg</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            backgroundColor: `${getStatusColor(vehicle.current_status)}20`,
                                            color: getStatusColor(vehicle.current_status),
                                            textTransform: 'capitalize'
                                        }}>
                                            {vehicle.current_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {vehicles.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                        No vehicles found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </Layout>
    );
};

export default VehicleList;
