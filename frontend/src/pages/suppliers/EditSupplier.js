import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { suppliersAPI } from '../../api/suppliers';
import '../orders/CreateOrder.css'; // Reusing form styles

const EditSupplier = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        contactEmail: '',
        phone: ''
    });

    useEffect(() => {
        fetchSupplier();
        // eslint-disable-next-line
    }, [id]);

    const fetchSupplier = async () => {
        try {
            const data = await suppliersAPI.getSupplierById(id);
            setFormData({
                name: data.name || '',
                contactEmail: data.contact_email || '', // map from backend snake_case
                phone: data.phone || ''
            });
        } catch (err) {
            setError('Failed to fetch supplier details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await suppliersAPI.updateSupplier(id, formData);
            navigate('/suppliers');
        } catch (err) {
            setError(err.message || 'Failed to update supplier');
            setSaving(false);
        }
    };

    if (loading) return <div className="page-container">Loading...</div>;

    return (
        <div className="page-container create-order-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Edit Supplier</h1>
                    <p className="page-subtitle">Update supplier information</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/suppliers')}>
                    Cancel
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="order-form-card">
                <div className="form-section">
                    <h3>Supplier Information</h3>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
                            <input
                                type="email"
                                name="contactEmail"
                                className="form-control"
                                value={formData.contactEmail}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                className="form-control"
                                value={formData.phone}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                    </div>


                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditSupplier;
