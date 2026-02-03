import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../../api/products';
import './ProductList.css';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    const fetchCategories = async () => {
        try {
            const data = await productsAPI.getCategories();
            if (data.categories) {
                setCategories(data.categories);
            }
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await productsAPI.getAllProducts({
                page,
                limit: 10,
                search: searchTerm,
                category: category || undefined
            });
            setProducts(data.products || []);
            if (data.pagination) {
                setTotalPages(data.pagination.totalPages);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, category]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleCategoryChange = (e) => {
        setCategory(e.target.value);
        setPage(1);
    };

    const getStockStatus = (stock) => {
        const count = parseInt(stock, 10);
        if (count === 0) return { label: 'Out of Stock', class: 'no-stock' };
        if (count < 50) return { label: 'Low Stock', class: 'low-stock' };
        return { label: 'In Stock', class: 'in-stock' };
    };

    if (loading && products.length === 0) {
        return <div className="loading-spinner">Loading Products...</div>;
    }

    return (
        <div className="page-container product-list-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Products</h1>
                    <p className="page-subtitle">Manage your product catalog</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/products/new')}>
                    + Add Product
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="product-filters">
                <input
                    type="text"
                    placeholder="Search products..."
                    className="search-input"
                    value={searchTerm}
                    onChange={handleSearch}
                />
                <select
                    className="filter-select"
                    value={category}
                    onChange={handleCategoryChange}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat.category} value={cat.category}>
                            {cat.category} ({cat.product_count})
                        </option>
                    ))}
                </select>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Supplier</th>

                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center">No products found.</td>
                            </tr>
                        ) : (
                            products.map((product) => {
                                const stockStatus = getStockStatus(product.total_stock);
                                return (
                                    <tr key={product.id}>
                                        <td className="font-medium">{product.name}</td>
                                        <td>{product.sku}</td>
                                        <td>{product.category || '-'}</td>
                                        <td>${parseFloat(product.price).toFixed(2)}</td>
                                        <td>
                                            <span className={`stock-badge ${stockStatus.class}`}>
                                                {product.total_stock} ({stockStatus.label})
                                            </span>
                                        </td>
                                        <td>{product.supplier_names || '-'}</td>

                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="btn-pagination"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span className="pagination-info">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        className="btn-pagination"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductList;
