import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../api/orders';
import { shipmentsAPI } from '../../api/shipments';
import { productsAPI } from '../../api/products';
import { inventoryAPI } from '../../api/inventory';
import { activityAPI } from '../../api/activity';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        totalProducts: 0,
        lowStockItems: 0,
        activeShipments: 0,
        totalRevenue: 0,
    });
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch Order Stats
            const orderStats = await ordersAPI.getOrderStats();

            // Fetch Active Shipments
            const shipmentsData = await shipmentsAPI.getAllShipments();
            const activeShipmentCount = (shipmentsData.shipments || []).filter(s => ['pending', 'in-transit'].includes(s.status)).length;

            // Fetch Product Count
            const productsData = await productsAPI.getAllProducts({ limit: 1 });
            const totalProducts = productsData.products ? productsData.pagination.totalCount : (Array.isArray(productsData) ? productsData.length : 0);

            // Fetch Low Stock
            const lowStockData = await inventoryAPI.getLowStockAlerts();
            // Check if it's { alerts: [...] } (from controller), { inventory: [...] } (old), or just [...]
            const lowStockArray = Array.isArray(lowStockData)
                ? lowStockData
                : (lowStockData.alerts || lowStockData.inventory || []);
            const lowStockCount = lowStockArray.length;

            // Fetch Recent Activity
            const recentActivity = await activityAPI.getRecentActivity();
            setActivities(recentActivity || []);

            setStats(prev => ({
                ...prev,
                totalOrders: orderStats.totalOrders,
                // Sum up 'pending' and 'processing' (case-insensitive)
                pendingOrders: orderStats.statusCounts ? (
                    typeof orderStats.statusCounts === 'object' && !Array.isArray(orderStats.statusCounts)
                        ? Object.entries(orderStats.statusCounts).reduce((total, [status, count]) => {
                            const s = status.toLowerCase();
                            if (s === 'pending' || s === 'processing') return total + count;
                            return total;
                        }, 0)
                        : (orderStats.statusCounts.find?.(s => s.status === 'pending')?.count || 0)
                ) : 0,
                totalRevenue: orderStats.totalRevenue,
                activeShipments: activeShipmentCount,
                totalProducts: totalProducts,
                lowStockItems: lowStockCount
            }));
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const StatCard = ({ title, value, subtitle, color, icon, onClick }) => (
        <div className="stat-card" style={{ borderLeftColor: color }} onClick={onClick}>
            <div className="stat-icon" style={{ backgroundColor: `${color}20` }}>
                {icon}
            </div>
            <div className="stat-content">
                <h3 className="stat-value">{value}</h3>
                <p className="stat-title">{title}</p>
                {subtitle && <p className="stat-subtitle">{subtitle}</p>}
            </div>
        </div>
    );

    const QuickAction = ({ title, icon, color, onClick }) => (
        <button className="quick-action" style={{ backgroundColor: color }} onClick={onClick}>
            <span className="quick-action-icon">{icon}</span>
            <span className="quick-action-text">{title}</span>
        </button>
    );

    const ActivityItem = ({ icon, title, description, time, color }) => (
        <div className="activity-item">
            <div className="activity-icon" style={{ backgroundColor: `${color}20` }}>
                {icon}
            </div>
            <div className="activity-content">
                <h4 className="activity-title">{title}</h4>
                <p className="activity-description">{description}</p>
            </div>
            <span className="activity-time">{time}</span>
        </div>
    );

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1 className="dashboard-title">📦 Warehouse Manager</h1>
                </div>
                <div className="header-right">
                    <div className="user-info">
                        <span className="user-name">{user?.fullName}</span>
                        <span className="user-role">{user?.role}</span>
                    </div>
                    <button className="btn-logout" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Welcome Section */}
                <div className="welcome-section">
                    <h2>Good Morning, {user?.fullName?.split(' ')[0]}! 👋</h2>
                    <p>Here's what's happening with your warehouse today</p>
                </div>

                {/* Statistics Grid */}
                <section className="stats-section">
                    <h3 className="section-title">Overview</h3>
                    <div className="stats-grid">
                        <StatCard
                            title="Total Orders"
                            value={stats.totalOrders}
                            subtitle={`${stats.pendingOrders} pending`}
                            color="#3b82f6"
                            icon="📦"
                            onClick={() => navigate('/orders')}
                        />
                        <StatCard
                            title="Products"
                            value={stats.totalProducts}
                            subtitle={`${stats.lowStockItems} low stock`}
                            color="#f59e0b"
                            icon="📊"
                            onClick={() => navigate('/products')}
                        />
                        <StatCard
                            title="Active Shipments"
                            value={stats.activeShipments}
                            subtitle="In transit"
                            color="#8b5cf6"
                            icon="🚚"
                            onClick={() => navigate('/shipments')}
                        />
                        <StatCard
                            title="Revenue"
                            value={`$${(stats.totalRevenue / 1000).toFixed(1)}K`}
                            subtitle="This month"
                            color="#10b981"
                            icon="💰"
                        />
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="actions-section">
                    <h3 className="section-title">Quick Actions</h3>
                    <div className="actions-grid">
                        <QuickAction
                            title="New Order"
                            icon="➕"
                            color="#3b82f6"
                            onClick={() => navigate('/orders/new')}
                        />
                        <QuickAction
                            title="View Inventory"
                            icon="📦"
                            color="#8b5cf6"
                            onClick={() => navigate('/inventory')}
                        />
                        <QuickAction
                            title="Customers"
                            icon="👥"
                            color="#10b981"
                            onClick={() => navigate('/customers')}
                        />

                        <QuickAction
                            title="Suppliers"
                            icon="🏭"
                            color="#ef4444"
                            onClick={() => navigate('/suppliers')}
                        />
                        <QuickAction
                            title="Vehicles"
                            icon="🚚"
                            color="#3b82f6"
                            onClick={() => navigate('/vehicles')}
                        />
                        <QuickAction
                            title="Drivers"
                            icon="🧑‍✈️"
                            color="#f59e0b"
                            onClick={() => navigate('/drivers')}
                        />
                        <QuickAction
                            title="Analytics"
                            icon="📊"
                            color="#8b5cf6"
                            onClick={() => navigate('/analytics')}
                        />
                    </div>
                </section>

                {/* Recent Activity */}
                <section className="activity-section">
                    <h3 className="section-title">Recent Activity</h3>
                    <div className="activity-list">
                        {activities.length === 0 ? (
                            <p className="no-activity">No recent activity</p>
                        ) : (
                            activities.map((activity, index) => (
                                <ActivityItem
                                    key={`${activity.type}-${activity.id}-${index}`}
                                    icon={activity.type === 'order' ? '📦' : '🚚'}
                                    title={activity.title}
                                    description={activity.description}
                                    time={new Date(activity.date).toLocaleString()}
                                    color={activity.type === 'order' ? '#3b82f6' : '#10b981'}
                                />
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;