import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { suppliersAPI } from '../../api/suppliers';
import { productsAPI } from '../../api/products';
import '../orders/CreateOrder.css'; // Reusing form styles

const AddSupplier = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [existingProducts, setExistingProducts] = useState([]);
    const [showProductSearch, setShowProductSearch] = useState(false);

    // Fetch products for linking
    React.useEffect(() => {
        productsAPI.getAllProducts({ limit: 100 }).then(data => {
            setExistingProducts(data.products || []);
        }).catch(err => console.error("Failed to load products", err));
    }, []);
    const [formData, setFormData] = useState({
        name: '',
        contactEmail: '',
        phone: '',
        products: []
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddProduct = () => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, { name: '', sku: '', price: '', category: '', weightPerUnit: '' }]
        }));
    };

    const handleAddExistingProduct = (product) => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, {
                name: product.name,
                sku: product.sku,
                price: product.price, // Default price, allow edit
                category: product.category || '',
                weightPerUnit: product.weight_per_unit || ''
            }]
        }));
    };

    const handleRemoveProduct = (index) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== index)
        }));
    };

    const handleProductChange = (index, field, value) => {
        setFormData(prev => {
            const newProducts = [...prev.products];
            newProducts[index] = { ...newProducts[index], [field]: value };
            return { ...prev, products: newProducts };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await suppliersAPI.createSupplier(formData);
            navigate('/suppliers');
        } catch (err) {
            setError(err.message || 'Failed to create supplier');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container create-order-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Add Supplier</h1>
                    <p className="page-subtitle">Register a new supplier</p>
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

                <div className="form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3>Products</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowProductSearch(true)} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                                🔍 Link Existing
                            </button>
                            <button type="button" className="btn-secondary" onClick={handleAddProduct} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                                + Create New
                            </button>
                        </div>
                    </div>

                    {showProductSearch && (
                        <div style={{ marginBottom: '20px', padding: '15px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e40af' }}>Select Product to Link</label>
                            <select
                                className="form-control"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const product = existingProducts.find(p => String(p.id) === e.target.value);
                                        if (product) handleAddExistingProduct(product);
                                        e.target.value = ""; // Reset
                                        setShowProductSearch(false);
                                    }
                                }}
                            >
                                <option value="">-- Choose a product --</option>
                                {existingProducts.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                                ))}
                            </select>
                            <button type="button" onClick={() => setShowProductSearch(false)} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    )}

                    {formData.products.length === 0 && (
                        <p style={{ color: '#6b7280', fontStyle: 'italic', marginBottom: '16px' }}>
                            No products added yet. Add products now to receive stock immediately.
                        </p>
                    )}

                    {formData.products.map((product, index) => (
                        <div key={index} style={{
                            background: '#f9fafb',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            marginBottom: '16px',
                            position: 'relative'
                        }}>
                            <button
                                type="button"
                                onClick={() => handleRemoveProduct(index)}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                                title="Remove Product"
                            >
                                &times;
                            </button>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Product Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. Wireless Mouse"
                                        value={product.name}
                                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>SKU</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. TECH-001"
                                        value={product.sku}
                                        onChange={(e) => handleProductChange(index, 'sku', e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Price ($)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="0.00"
                                        value={product.price}
                                        onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                                        required
                                        step="0.01"
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Category</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. Electronics"
                                        value={product.category}
                                        onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Weight (kg)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="0.0"
                                        value={product.weightPerUnit}
                                        onChange={(e) => handleProductChange(index, 'weightPerUnit', e.target.value)}
                                        step="0.1"
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Supplier'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddSupplier;
