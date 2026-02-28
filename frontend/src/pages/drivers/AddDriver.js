import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Layout from '../../components/layout/Layout';

const AddDriver = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        licenseNumber: '',
        licenseType: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/drivers', formData);
            navigate('/drivers');
        } catch (err) {
            setError(err.message || 'Failed to create driver');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="content-header">
                <h2>Add New Driver</h2>
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
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>License Number *</label>
                        <input
                            type="text"
                            required
                            value={formData.licenseNumber}
                            onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
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
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}
                        >
                            {loading ? 'Creating...' : 'Create Driver'}
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

export default AddDriver;
