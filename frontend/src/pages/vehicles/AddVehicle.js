import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Layout from '../../components/layout/Layout';

const AddVehicle = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [formData, setFormData] = useState({
        licensePlate: '',
        maxCapacity: '',
        driverId: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        // Ideally fetch available drivers, but for now we fetch all
        const fetchDrivers = async () => {
            try {
                const res = await apiClient.get('/drivers');
                setDrivers(res.data.drivers || []);
            } catch (e) {
                console.error('Failed to load drivers');
            }
        };
        fetchDrivers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/vehicles', formData);
            navigate('/vehicles');
        } catch (err) {
            setError(err.message || 'Failed to create vehicle');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="content-header">
                <h2>Add New Vehicle</h2>
            </div>
            <div style={{ maxWidth: '600px', background: 'white', padding: '20px', borderRadius: '8px' }}>
                {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>License Plate *</label>
                        <input
                            type="text"
                            required
                            value={formData.licensePlate}
                            onChange={e => setFormData({ ...formData, licensePlate: e.target.value })}
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Max Capacity (kg) *</label>
                        <input
                            type="number"
                            required
                            value={formData.maxCapacity}
                            onChange={e => setFormData({ ...formData, maxCapacity: e.target.value })}
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <label style={{ display: 'block' }}>Assign Driver</label>
                            <span
                                onClick={() => navigate('/drivers/new')}
                                style={{ fontSize: '0.875rem', color: '#3b82f6', cursor: 'pointer' }}
                            >
                                + Create New Driver
                            </span>
                        </div>
                        <select
                            value={formData.driverId}
                            onChange={e => setFormData({ ...formData, driverId: e.target.value })}
                            style={{ width: '100%', padding: '8px' }}
                        >
                            <option value="">-- Select Driver --</option>
                            {drivers.map(d => (
                                <option
                                    key={d.id}
                                    value={d.id}
                                    disabled={d.status !== 'available'}
                                >
                                    {d.full_name} ({d.status}) {d.vehicle_plate ? `- Assigned to ${d.vehicle_plate}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}
                        >
                            {loading ? 'Creating...' : 'Create Vehicle'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/vehicles')}
                            style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px' }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default AddVehicle;
