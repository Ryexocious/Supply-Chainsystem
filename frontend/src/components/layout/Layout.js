import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../pages/dashboard/Dashboard.css'; // Re-use dashboard styles

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1 className="dashboard-title" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                        📦 Warehouse Manager
                    </h1>
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
            <main className="dashboard-main">
                <button className="btn-back" onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>
                    ← Back to Dashboard
                </button>
                {children}
            </main>
        </div>
    );
};

export default Layout;
