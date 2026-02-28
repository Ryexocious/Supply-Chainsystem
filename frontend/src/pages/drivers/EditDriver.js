import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/client';
import Layout from '../../components/layout/Layout';

const EditDriver = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        licenseType: '',
        status: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDriver = async () => {
            try {
                const res = await apiClient.get(`/drivers/${id}`);
                const driver = res.data.driver;
                setFormData({
                    fullName: driver.full_name,
                    licenseType: driver.license_type || '',
                    status: driver.status
                });
            } catch (err) {
                setError('Failed to fetch driver details');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchDriver();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.put(`/drivers/${id}`, formData);
            navigate('/drivers');
        } catch (err) {
            setError(err.message || 'Failed to update driver');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <Layout><div>Loading...</div></Layout>;

    return (
        <Layout>
            <div className="content-header">
                <h2>Edit Driver</h2>
            </div>
            <div style={{ maxWidth: '600px', background: 'white', padding: '20px', borderRadius: '8px' }}>
                {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Full Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                    {/* License Number is typically immutable or requires distinct process, skipping for edit */}

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>License Type</label>
                        <select
                            value={formData.licenseType}
                            onChange={e => setFormData({ ...formData, licenseType: e.target.value })}
                            style={{ width: '100%', padding: '8px' }}
                        >
                            <option value="">-- Select Type --</option>
                            <option value="Class A">Class A</option>
                            <option value="Class B">Class B</option>
                            <option value="Class C">Class C</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Status</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            style={{ width: '100%', padding: '8px' }}
                        >
                            <option value="available">Available</option>
                            <option value="on-trip">On Trip</option>
                            <option value="busy">Busy</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}
                        >
                            {loading ? 'Updating...' : 'Update Driver'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/drivers')}
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

export default EditDriver;
