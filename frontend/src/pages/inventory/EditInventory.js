import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryAPI } from '../../api/inventory';
import '../orders/CreateOrder.css';

const EditInventory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inventoryItem, setInventoryItem] = useState(null);
    const [formData, setFormData] = useState({
        quantity: '',
        operation: 'set'
    });

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const data = await inventoryAPI.getInventoryById(id);
                setInventoryItem(data.inventory);
                setFormData(prev => ({ ...prev, quantity: data.inventory.quantity }));
            } catch (err) {
                setError('Failed to fetch inventory item');
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // We can either set the new quantity directly or use add/subtract
            // For this UI, we will just SET the new quantity.
            // But the backend supports operation='add'/'subtract'/'set'.
            await inventoryAPI.updateInventory(id, {
                quantity: parseInt(formData.quantity),
                operation: 'set'
            });
            navigate('/inventory');
        } catch (err) {
            setError(err.message || 'Failed to update inventory');
            setLoading(false);
        }
    };

    if (loading) return <div className="page-container">Loading...</div>;
    if (!inventoryItem) return <div className="page-container">Item not found</div>;

    return (
        <div className="page-container create-order-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Edit Inventory</h1>
                    <p className="page-subtitle">Update stock count for {inventoryItem.product_name}</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/inventory')}>
                    Cancel
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="order-form-card">
                <div className="form-section">
                    <h3>Current Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label>Product</label>
                            <div className="form-control" style={{ background: '#f3f4f6' }}>{inventoryItem.product_name}</div>
                        </div>
                        <div>
                            <label>Location</label>
                            <div className="form-control" style={{ background: '#f3f4f6' }}>{inventoryItem.location_name || 'N/A'}</div>
                        </div>
                        <div>
                            <label>SKU</label>
                            <div className="form-control" style={{ background: '#f3f4f6' }}>{inventoryItem.sku}</div>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Update Stock</h3>
                    <div className="form-group">
                        <label>Quantity on Hand</label>
                        <input
                            type="number"
                            min="0"
                            className="form-control"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            required
                        />
                        <small style={{ color: '#6b7280' }}>Manually adjust the stock count.</small>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Update Stock'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditInventory;
