import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../../api/products';
import '../orders/CreateOrder.css'; // Reusing common form styles

const AddProduct = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        category: '',
        weightPerUnit: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Basic validation
            if (!formData.name || !formData.sku || !formData.price) {
                throw new Error('Name, SKU, and Price are required');
            }

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                weightPerUnit: formData.weightPerUnit ? parseFloat(formData.weightPerUnit) : 0
            };

            await productsAPI.createProduct(payload);
            navigate('/products');
        } catch (err) {
            console.error('Failed to create product:', err);
            setError(err.response?.data?.error || err.message || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Add New Product</h1>
                <button className="btn-secondary" onClick={() => navigate('/products')}>
                    Cancel
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3>Product Details</h3>
                        <div className="form-group">
                            <label>Product Name*</label>
                            <input
                                type="text"
                                name="name"
                                className="form-control"
                                placeholder="e.g. Ergonomic Office Chair"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>SKU (Stock Keeping Unit)*</label>
                                <input
                                    type="text"
                                    name="sku"
                                    className="form-control"
                                    placeholder="e.g. FURN-001"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Price ($)*</label>
                                <input
                                    type="number"
                                    name="price"
                                    className="form-control"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    className="form-control"
                                    placeholder="e.g. Furniture"
                                    value={formData.category}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Weight per Unit (kg)</label>
                                <input
                                    type="number"
                                    name="weightPerUnit"
                                    className="form-control"
                                    placeholder="0.0"
                                    value={formData.weightPerUnit}
                                    onChange={handleChange}
                                    step="0.1"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate('/products')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProduct;
