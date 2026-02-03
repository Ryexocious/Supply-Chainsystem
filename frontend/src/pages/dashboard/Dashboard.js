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

    const StatCard = ({ title, value, subtitle, color, onClick, onSubtitleClick }) => (
        <div className="stat-card" style={{ background: color, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
            {/* Icon removed as per request for no emojis */
            /* <div className="stat-icon" style={{ backgroundColor: `${color}20` }}>
                {icon}
            </div> */}
            <div className="stat-content">
                <h3 className="stat-value">{value}</h3>
                <p className="stat-title">{title}</p>
                {subtitle && (
                    <p
                        className={`stat-subtitle ${onSubtitleClick ? 'stat-subtitle-action' : ''}`}
                        onClick={(e) => {
                            if (onSubtitleClick) {
                                e.stopPropagation();
                                onSubtitleClick();
                            }
                        }}
                        style={onSubtitleClick ? { color: 'inherit' } : {}}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );

    const QuickAction = ({ title, color, onClick }) => (
        <button className="quick-action" style={{ background: color }} onClick={onClick}>
            {/* <span className="quick-action-icon">{icon}</span> */}
            <span className="quick-action-text">{title}</span>
        </button>
    );

    const ActivityItem = ({ title, description, time, color }) => (
        <div className="activity-item">
            <div className="activity-indicator" style={{ backgroundColor: color }}></div>
            {/* <div className="activity-icon" style={{ backgroundColor: `${color}20` }}>
                {icon}
            </div> */}
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
                    <h1 className="dashboard-title">Dashboard</h1>
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
                {/* Welcome Section REMOVED */}


                {/* Statistics Grid */}
                <section className="stats-section">
                    <h3 className="section-title">Overview</h3>
                    <div className="stats-grid">
                        <StatCard
                            title="Total Orders"
                            value={stats.totalOrders}
                            subtitle={`${stats.pendingOrders} pending`}
                            color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                            onClick={() => navigate('/orders')}
                        />
                        <StatCard
                            title="Products"
                            value={stats.totalProducts}
                            subtitle={`${stats.lowStockItems} low stock`}
                            color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            onClick={() => navigate('/products')}
                            onSubtitleClick={() => navigate('/inventory?lowStock=true')}
                        />
                        <StatCard
                            title="Active Shipments"
                            value={stats.activeShipments}
                            subtitle="In transit"
                            color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                            onClick={() => navigate('/shipments')}
                        />
                        <StatCard
                            title="Revenue"
                            value={`$${(stats.totalRevenue / 1000).toFixed(1)}K`}
                            subtitle="This month"
                            color="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        />
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="actions-section">
                    <h3 className="section-title">Quick Actions</h3>
                    <div className="actions-grid">
                        <QuickAction
                            title="New Order"
                            color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                            onClick={() => navigate('/orders/new')}
                        />
                        <QuickAction
                            title="View Inventory"
                            color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                            onClick={() => navigate('/inventory')}
                        />
                        <QuickAction
                            title="Customers"
                            color="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                            onClick={() => navigate('/customers')}
                        />

                        <QuickAction
                            title="Suppliers"
                            color="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                            onClick={() => navigate('/suppliers')}
                        />
                        <QuickAction
                            title="Vehicles"
                            color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                            onClick={() => navigate('/vehicles')}
                        />
                        <QuickAction
                            title="Drivers"
                            color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            onClick={() => navigate('/drivers')}
                        />
                        <QuickAction
                            title="Analytics"
                            color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
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