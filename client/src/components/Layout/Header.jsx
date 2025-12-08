import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'System Admin',
      office: 'Finance Officer',
      department: 'Department User',
      hod: 'Head of Department',
      vice_principal: 'Vice Principal',
      principal: 'Principal',
      auditor: 'Auditor',
    };
    return roleNames[role] || role;
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/graphical-dashboard', label: 'Analytics', icon: '📈' },
    ];

    switch (user.role) {
      case 'admin':
        return [
          ...baseItems,
          { path: '/users', label: 'Users', icon: '👥' },
          { path: '/departments', label: 'Departments', icon: '🏢' },
          { path: '/budget-heads', label: 'Budget Heads', icon: '💰' },
          { path: '/settings', label: 'Settings', icon: '⚙️' },
        ];
      case 'office':
        return [
          ...baseItems,
          { path: '/allocations', label: 'Allocations', icon: '📋' },
          { path: '/approvals', label: 'Approvals', icon: '✅' },
          { path: '/reports', label: 'Reports', icon: '📈' },
        ];
      case 'department':
        return [
          ...baseItems,
          { path: '/expenditures', label: 'My Expenditures', icon: '💸' },
          { path: '/submit-expenditure', label: 'Submit Expenditure', icon: '➕' },
        ];
      case 'hod':
        return [
          ...baseItems,
          { path: '/department-expenditures', label: 'Department Expenditures', icon: '📝' },
          { path: '/approvals', label: 'Approvals', icon: '✅' },
        ];
      case 'vice_principal':
      case 'principal':
        return [
          ...baseItems,
          { path: '/approvals', label: 'Approvals', icon: '✅' },
          { path: '/reports', label: 'Reports', icon: '📈' },
          { path: '/consolidated-view', label: 'Consolidated View', icon: '📊' },
        ];
      case 'auditor':
        return [
          ...baseItems,
          { path: '/audit-logs', label: 'Audit Logs', icon: '🔍' },
          { path: '/reports', label: 'Reports', icon: '📈' },
        ];
      default:
        return baseItems;
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <span className="logo-icon">🎓</span>
          <span className="logo-text">CBMS</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          {getNavigationItems().map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="nav-link"
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Notifications */}
        <NotificationBell />

        {/* User Profile */}
        <div className="user-section">
          <div className="user-info" onClick={toggleProfile}>
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{getRoleDisplayName(user?.role)}</span>
            </div>
            <span className="dropdown-arrow">▼</span>
          </div>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="profile-dropdown">
              <Link to="/profile" className="dropdown-item">
                <span className="dropdown-icon">👤</span>
                Profile
              </Link>
              <Link to="/change-password" className="dropdown-item">
                <span className="dropdown-icon">🔒</span>
                Change Password
              </Link>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item logout-btn">
                <span className="dropdown-icon">🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <span className="hamburger"></span>
          <span className="hamburger"></span>
          <span className="hamburger"></span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="nav-mobile">
          {getNavigationItems().map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="nav-link-mobile"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
          <div className="mobile-user-info">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{getRoleDisplayName(user?.role)}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="mobile-logout-btn">
            Logout
          </button>
        </nav>
      )}

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMenuOpen(false)}></div>
      )}
    </header>
  );
};

export default Header;
