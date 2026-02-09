import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { suppliersAPI } from '../../api/suppliers';
import '../orders/OrderList.css'; // Reusing existing table styles

const SupplierList = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const data = await suppliersAPI.getAllSuppliers();
            setSuppliers(data || []);
        } catch (err) {
            setError('Failed to fetch suppliers');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="page-container">Loading...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Suppliers</h1>
                    <p className="page-subtitle">Manage your supply chain partners</p>
                </div>
                <div>
                    <button className="btn-secondary" style={{ marginRight: '10px' }} onClick={() => navigate('/inventory/receive')}>
                        Receive Stock
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/suppliers/new')}>
                        + Add Supplier
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact Email</th>
                            <th>Phone</th>

                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map((supplier) => (
                            <tr key={supplier.id}>
                                <td className="font-medium">{supplier.name}</td>
                                <td>{supplier.contact_email}</td>
                                <td>{supplier.phone}</td>

                                <td>
                                    <button className="btn-action" onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                        {suppliers.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>
                                    No suppliers found. Add one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SupplierList;
