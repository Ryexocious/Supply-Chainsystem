import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Layout from '../../components/layout/Layout';
import '../../pages/dashboard/Dashboard.css';

const DriverList = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            const response = await apiClient.get('/drivers');
            setDrivers(response.data.drivers || []);
        } catch (err) {
            setError('Failed to fetch drivers');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this driver?')) {
            try {
                await apiClient.delete(`/drivers/${id}`);
                fetchDrivers();
            } catch (err) {
                alert('Failed to delete driver');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return '#10b981';
            case 'on-trip': return '#3b82f6';
            case 'busy': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Drivers</h1>
                    <p className="page-subtitle">Manage your drivers</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => navigate('/drivers/new')}>
                        + Add Driver
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
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Name</th>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>License Number</th>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>License Type</th>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Assigned Vehicle</th>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Status</th>
                                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((driver) => (
                                <tr key={driver.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ fontWeight: '500' }}>{driver.full_name}</span>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>{driver.license_number}</td>
                                    <td style={{ padding: '16px 24px' }}>{driver.license_type || '-'}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        {driver.vehicle_plate ? (
                                            <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                                                {driver.vehicle_plate}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#9ca3af' }}>None</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            backgroundColor: `${getStatusColor(driver.status)}20`,
                                            color: getStatusColor(driver.status),
                                            textTransform: 'capitalize'
                                        }}>
                                            {driver.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => navigate(`/drivers/${driver.id}/edit`)}
                                            style={{ marginRight: '10px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(driver.id)}
                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {drivers.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                        No drivers found
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

export default DriverList;
