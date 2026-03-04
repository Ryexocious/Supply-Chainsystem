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
    const [dailySales, setDailySales] = useState([]);
    const [highValue, setHighValue] = useState([]);
    const [supplierRel, setSupplierRel] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [orphaned, setOrphaned] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [clv, sales, stock, drivers, inv, dSales, hValue, sRel, audit, orph] = await Promise.all([
                    analyticsService.getCustomerLifetimeValue(),
                    analyticsService.getMonthlySales(),
                    analyticsService.getLowStockAlerts(),
                    analyticsService.getDriverEfficiency(),
                    analyticsService.getInventoryValue(),
                    analyticsService.getDailySalesMovingAverage(),
                    analyticsService.getUnfulfilledHighValueOutputs(),
                    analyticsService.getSupplierReliabilityAnalysis(),
                    analyticsService.getOrderStatusAudit(),
                    analyticsService.getOrphanedInventory()
                ]);

                setClvData(clv);
                setSalesData(sales);
                setLowStock(stock);
                setDriverStats(drivers);
                setInventoryValue(inv);
                setDailySales(dSales);
                setHighValue(hValue);
                setSupplierRel(sRel);
                setAuditLogs(audit);
                setOrphaned(orph);
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

                <div className="analytics-full-width" style={{ marginTop: '20px' }}>
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

                <div className="analytics-grid" style={{ marginTop: '20px' }}>
                    {/* Unfulfilled High-Value Orders */}
                    <div className="analytics-card warning-card">
                        <h3>High-Value Unfulfilled Orders</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Amount ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {highValue.map((h, idx) => (
                                    <tr key={idx}>
                                        <td>#{h.id}</td>
                                        <td>{h.company_name}</td>
                                        <td>{parseFloat(h.total_amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {highValue.length === 0 && <tr><td colSpan="3">All high-value orders fulfilled!</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    {/* Supplier Reliability */}
                    <div className="analytics-card">
                        <h3>Supplier Analysis (Avg Price)</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Supplier</th>
                                    <th>Products</th>
                                    <th>Avg Price ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplierRel.map((s, idx) => (
                                    <tr key={idx}>
                                        <td>{s.supplier_name}</td>
                                        <td>{s.products_count}</td>
                                        <td>{parseFloat(s.avg_product_price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Orphaned Inventory */}
                    <div className="analytics-card alert-card">
                        <h3>Orphaned Inventory (&gt;6 Months)</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty in Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orphaned.map((o, idx) => (
                                    <tr key={idx}>
                                        <td>{o.product_name}</td>
                                        <td>{o.stock_quantity}</td>
                                    </tr>
                                ))}
                                {orphaned.length === 0 && <tr><td colSpan="2">No orphaned inventory found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="analytics-grid" style={{ marginTop: '20px' }}>
                    {/* Daily Sales Moving Avg */}
                    <div className="analytics-card">
                        <h3>Daily Sales Moving Average (7-Day)</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Daily Sales ($)</th>
                                    <th>7-Day Moving Avg ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailySales.map((d, idx) => (
                                    <tr key={idx}>
                                        <td>{d.date ? new Date(d.date).toLocaleDateString() : 'N/A'}</td>
                                        <td>{parseFloat(d.daily_revenue).toLocaleString()}</td>
                                        <td>{parseFloat(d.seven_day_moving_avg).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Audit Logs */}
                    <div className="analytics-card">
                        <h3>Recent Shipment Activity (JSON Logs)</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>User</th>
                                    <th>Order #</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map((a, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(a.changed_at).toLocaleString()}</td>
                                        <td>{a.changed_by}</td>
                                        <td>#{a.order_id}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AnalyticsDashboard;
