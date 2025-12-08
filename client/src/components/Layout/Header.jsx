import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';
import {
  LuLayoutDashboard,
  LuLineChart,
  LuUsers,
  LuBuilding2,
  LuWallet,
  LuSettings,
  LuClipboardList,
  LuCheckSquare,
  LuCalculator,
  LuUser,
  LuLock,
  LuLogOut,
  LuFileText,
  LuSearch,
  LuPlusCircle,
  LuFiles,
  LuMenu,
  LuGraduationCap,
  LuChevronDown
} from 'react-icons/lu';
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
      { path: '/dashboard', label: 'Dashboard', icon: <LuLayoutDashboard /> },
      { path: '/graphical-dashboard', label: 'Analytics', icon: <LuLineChart /> },
    ];

    switch (user.role) {
      case 'admin':
        return [
          ...baseItems,
          { path: '/users', label: 'Users', icon: <LuUsers /> },
          { path: '/departments', label: 'Departments', icon: <LuBuilding2 /> },
          { path: '/budget-heads', label: 'Budget Heads', icon: <LuWallet /> },
          { path: '/settings', label: 'Settings', icon: <LuSettings /> },
        ];
      case 'office':
        return [
          ...baseItems,
          { path: '/allocations', label: 'Allocations', icon: <LuClipboardList /> },
          { path: '/approvals', label: 'Approvals', icon: <LuCheckSquare /> },
          { path: '/reports', label: 'Reports', icon: <LuFileText /> },
        ];
      case 'department':
        return [
          ...baseItems,
          { path: '/expenditures', label: 'My Expenditures', icon: <LuCalculator /> },
          { path: '/submit-expenditure', label: 'Submit Expenditure', icon: <LuPlusCircle /> },
        ];
      case 'hod':
        return [
          ...baseItems,
          { path: '/department-expenditures', label: 'Department Expenditures', icon: <LuFiles /> },
          { path: '/approvals', label: 'Approvals', icon: <LuCheckSquare /> },
        ];
      case 'vice_principal':
      case 'principal':
        return [
          ...baseItems,
          { path: '/approvals', label: 'Approvals', icon: <LuCheckSquare /> },
          { path: '/reports', label: 'Reports', icon: <LuFileText /> },
          { path: '/consolidated-view', label: 'Consolidated View', icon: <LuLineChart /> },
        ];
      case 'auditor':
        return [
          ...baseItems,
          { path: '/audit-logs', label: 'Audit Logs', icon: <LuSearch /> },
          { path: '/reports', label: 'Reports', icon: <LuFileText /> },
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
          <span className="logo-icon"><LuGraduationCap /></span>
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
            <span className="dropdown-arrow"><LuChevronDown /></span>
          </div>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="profile-dropdown">
              <Link to="/profile" className="dropdown-item">
                <span className="dropdown-icon"><LuUser /></span>
                Profile
              </Link>
              <Link to="/change-password" className="dropdown-item">
                <span className="dropdown-icon"><LuLock /></span>
                Change Password
              </Link>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item logout-btn">
                <span className="dropdown-icon"><LuLogOut /></span>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <LuMenu size={24} />
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav className={`nav-mobile ${isMenuOpen ? 'open' : ''}`}>
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

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMenuOpen(false)}></div>
      )}
    </header>
  );
};

export default Header;
