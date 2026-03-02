import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import * as analyticsService from '../../services/analyticsService';
import './Analytics.css'; // We will create this next

const AnalyticsDashboard = () => {
    const [clvData, setClvData] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [driverStats, setDriverStats] = useState([]);
    const [inventoryValue, setInventoryValue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [clv, sales, stock, drivers, inv] = await Promise.all([
                    analyticsService.getCustomerLifetimeValue(),
                    analyticsService.getMonthlySales(),
                    analyticsService.getLowStockAlerts(),
                    analyticsService.getDriverEfficiency(),
                    analyticsService.getInventoryValue()
                ]);

                setClvData(clv);
                setSalesData(sales);
                setLowStock(stock);
                setDriverStats(drivers);
                setInventoryValue(inv);
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return <Layout><div>Loading Analytics...</div></Layout>;

    return (
        <Layout>
            <div className="analytics-container">
                <h1>Analytics Dashboard</h1>

                <div className="analytics-grid">
                    {/* Inventory Value Card */}
                    <div className="analytics-card">
                        <h3>Inventory Value by Warehouse</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Warehouse</th>
                                    <th>Items</th>
                                    <th>Value ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryValue.map((w, idx) => (
                                    <tr key={idx}>
                                        <td>{w.location_name}</td>
                                        <td>{w.total_items}</td>
                                        <td>{parseFloat(w.total_inventory_value).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="analytics-card alert-card">
                        <h3>Low Stock Alerts (Critical)</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStock.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.name}</td>
                                        <td className="text-danger">{item.quantity}</td>
                                        <td>{item.location_name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Top Customers (CLV) */}
                    <div className="analytics-card warning-card">
                        <h3>Top Customers (CLV)</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Company</th>
                                    <th>Tier</th>
                                    <th>Spend ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clvData.map((c, idx) => (
                                    <tr key={idx}>
                                        <td>{c.spend_rank}</td>
                                        <td>{c.company_name}</td>
                                        <td>
                                            <span className={`badge badge-${c.tier.toLowerCase()}`}>{c.tier}</span>
                                        </td>
                                        <td>{parseFloat(c.total_spend).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Driver Efficiency */}
                    <div className="analytics-card">
                        <h3>Driver Efficiency</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Driver</th>
                                    <th>Deliveries</th>
                                    <th>Avg Time (Hr)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {driverStats.map((d, idx) => (
                                    <tr key={idx}>
                                        <td>{d.full_name}</td>
                                        <td>{d.deliveries}</td>
                                        <td>{parseFloat(d.avg_hours).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="analytics-full-width">
                    <h3>Monthly Revenue by Category</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Category</th>
                                <th>Revenue ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesData.map((s, idx) => (
                                <tr key={idx} className={!s.category ? 'row-total' : ''}>
                                    <td>{s.month || 'Total'}</td>
                                    <td>{s.category || 'All Categories'}</td>
                                    <td>{parseFloat(s.revenue).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default AnalyticsDashboard;
