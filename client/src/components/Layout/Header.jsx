import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';
import Tooltip from '../Tooltip/Tooltip';
import {
  Search,
  Menu,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import './Header.css';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Left Section: Mobile Menu & Search */}
        <div className="header-left">
          <Tooltip text="Toggle Menu" position="right">
            <button className="mobile-menu-btn" onClick={onMenuClick}>
              <Menu size={24} />
            </button>
          </Tooltip>
          
          <div className="header-search">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="search-input"
            />
          </div>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="header-right">
          <Tooltip text="Settings" position="bottom">
            <button className="action-btn">
              <Settings size={20} />
            </button>
          </Tooltip>
          
          <NotificationBell />

          <div className="user-dropdown">
            <div 
              className="user-profile-btn"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info-header">
                <span className="user-name-header">{user?.name}</span>
                <span className="user-role-header">{user?.role}</span>
              </div>
              <ChevronDown size={16} color="#6b7280" />
            </div>

            {isProfileOpen && (
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                  <User size={16} />
                  Profile
                </Link>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item logout-item">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
