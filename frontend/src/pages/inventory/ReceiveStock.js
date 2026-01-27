import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { suppliersAPI } from '../../api/suppliers';
import { productsAPI } from '../../api/products';
import { warehouseAPI } from '../../api/warehouses';
import { inventoryAPI } from '../../api/inventory';
import '../orders/CreateOrder.css';

const ReceiveStock = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [formData, setFormData] = useState({
        supplierId: '',
        productId: '',
        warehouseId: '',
        quantity: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch independently to identify failures
                const fetchSuppliers = suppliersAPI.getAllSuppliers().catch(e => { throw new Error('Suppliers: ' + (e.message || 'Failed')); });
                const fetchProducts = productsAPI.getAllProducts({ limit: 1000 }).catch(e => { throw new Error('Products: ' + (e.message || 'Failed')); });
                const fetchWarehouses = warehouseAPI.getAllWarehouses().catch(e => { throw new Error('Warehouses: ' + (e.message || 'Failed')); });

                const [suppliersData, productsData, warehousesData] = await Promise.all([
                    fetchSuppliers,
                    fetchProducts,
                    fetchWarehouses
                ]);

                setSuppliers(Array.isArray(suppliersData) ? suppliersData : (suppliersData.suppliers || []));
                setProducts(productsData.products || []);
                setWarehouses(warehousesData.warehouses || []);
            } catch (err) {
                setError('Failed to load data: ' + err.message);
                console.error(err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'supplierId' ? { productId: '' } : {})
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        if (!formData.supplierId || !formData.productId || !formData.warehouseId || !formData.quantity) {
            setError('All fields are required');
            setLoading(false);
            return;
        }

        try {
            await inventoryAPI.addInventory({
                productId: formData.productId,
                warehouseId: formData.warehouseId,
                quantity: parseInt(formData.quantity)
            });
            setSuccessMessage('Stock received successfully!');
            // Reset form partially
            setFormData(prev => ({ ...prev, quantity: '', productId: '' }));

            // Optionally redirect after short delay or offer "Receive More"
            setTimeout(() => {
                navigate('/inventory');
            }, 1000);
        } catch (err) {
            // Handle if inventory record already exists -> maybe we need to update instead?
            // The backend inventoryController.addInventory says: "Inventory record already exists" (409)
            // If 409, we should try update.
            if (err.status === 409 && err.existingRecord) {
                try {
                    // We need to call updateInventory. But updateInventory takes ID. 
                    // The error might return existingRecord.inventoryid
                    const existingId = err.existingRecord?.inventoryid || err.response?.data?.existingRecord?.inventoryid;
                    if (existingId) {
                        await inventoryAPI.updateInventory(existingId, {
                            quantity: parseInt(formData.quantity),
                            operation: 'add'
                        });
                        setSuccessMessage('Stock added to existing inventory!');
                        setTimeout(() => navigate('/inventory'), 1000);
                        return;
                    }
                } catch (updateErr) {
                    setError(updateErr.message || 'Failed to update existing inventory');
                }
            } else {
                setError(err.message || 'Failed to receive stock');
            }
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="page-container">Loading...</div>;

    return (
        <div className="page-container create-order-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Receive Stock</h1>
                    <p className="page-subtitle">Update inventory from supplier shipments</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/inventory')}>
                    Cancel
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}
            {successMessage && <div className="success-banner" style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{successMessage}</div>}

            <form onSubmit={handleSubmit} className="order-form-card">
                <div className="form-section">
                    <h3>Shipment Details</h3>

                    <div className="form-group">
                        <label>Supplier</label>
                        <select
                            name="supplierId"
                            className="form-control"
                            value={formData.supplierId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Supplier...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Warehouse (Location)</label>
                        <select
                            name="warehouseId"
                            className="form-control"
                            value={formData.warehouseId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Warehouse...</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.location_name} (Max: {w.max_capacity})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Items</h3>
                    <div className="form-group">
                        <label>Product</label>
                        <select
                            name="productId"
                            className="form-control"
                            value={formData.productId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Product...</option>
                            {products.filter(p => {
                                if (!formData.supplierId) return true;
                                if (p.supplier_ids && Array.isArray(p.supplier_ids)) {
                                    return p.supplier_ids.includes(parseInt(formData.supplierId));
                                }
                                return false;
                            }).map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} - SKU: {p.sku}
                                </option>
                            ))}
                        </select>
                        {formData.supplierId && <small style={{ color: '#6b7280' }}>Showing products for selected supplier only. <a href="#" onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, supplierId: '' })); }}>Clear filter</a></small>}
                    </div>

                    <div className="form-group">
                        <label>Quantity Received</label>
                        <input
                            type="number"
                            name="quantity"
                            min="1"
                            className="form-control"
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Confirm Receipt'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReceiveStock;
