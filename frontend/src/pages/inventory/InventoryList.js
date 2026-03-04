import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { inventoryAPI } from '../../api/inventory';
import '../orders/OrderList.css';

const InventoryList = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchInventory();
    }, [location.search]);

    const fetchInventory = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams(location.search);
            const lowStock = params.get('lowStock');
            const data = await inventoryAPI.getAllInventory({ lowStock });
            setInventory(data.inventory);
        } catch (err) {
            setError(err.message || 'Failed to fetch inventory');
        } finally {
            setLoading(false);
        }
    };

    const handlePredictRestock = async (productId) => {
        try {
            const data = await inventoryAPI.predictRestockDate(productId);
            alert(`Predicted Restock Date: ${new Date(data.expected_restock_date).toLocaleDateString()}`);
        } catch (err) {
            alert('Failed to predict restock date: ' + (err.message || 'Unknown error'));
        }
    };

    const getStockColor = (level) => {
        const colors = {
            critical: '#ef4444',
            low: '#f59e0b',
            medium: '#3b82f6',
            good: '#10b981',
        };
        return colors[level] || '#6b7280';
    };

    const getStockIcon = (level) => {
        const icons = {
            critical: '🔴',
            low: '🟡',
            medium: '🟠',
            good: '🟢',
        };
        return icons[level] || '⚪';
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Inventory</h1>
                    <p className="page-subtitle">Manage your stock levels</p>
                </div>
                <div>
                    <button className="btn-secondary" style={{ marginRight: '10px' }} onClick={() => navigate('/inventory/receive')}>
                        + Receive Stock
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Warehouse</th>
                            <th>Quantity</th>
                            <th>Stock Level</th>
                            <th>Last Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item) => (
                            <tr key={item.id}>
                                <td className="font-medium">{item.product_name}</td>
                                <td>{item.sku}</td>
                                <td>{item.warehouse_name}</td>
                                <td className="font-medium">{item.quantity} units</td>
                                <td>
                                    <span
                                        className="status-badge"
                                        style={{
                                            backgroundColor: `${getStockColor(item.stock_level)}20`,
                                            color: getStockColor(item.stock_level),
                                        }}
                                    >
                                        {getStockIcon(item.stock_level)} {item.stock_level}
                                    </span>
                                </td>
                                <td>
                                    {new Date(item.last_updated).toLocaleDateString()}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn-action"
                                            onClick={() => navigate(`/inventory/edit/${item.id}`)}
                                        >
                                            Manage
                                        </button>
                                        <button
                                            className="btn-action"
                                            style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
                                            onClick={() => handlePredictRestock(item.product_id)}
                                        >
                                            Predict Restock
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryList;