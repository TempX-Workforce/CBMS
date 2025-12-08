import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DepartmentUsers.css';

const DepartmentUsers = () => {
  const { user } = useAuth();
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    isActive: ''
  });

  useEffect(() => {
    if (user?.department) {
      fetchDepartmentUsers();
    }
  }, [user, filters]);

  const fetchDepartmentUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.isActive) params.isActive = filters.isActive;
      
      const response = await usersAPI.getUsersByDepartment(user.department, params);
      setDepartmentUsers(response.data.data.users);
      setDepartment(response.data.data.department);
      setError(null);
    } catch (err) {
      setError('Failed to fetch department users');
      console.error('Error fetching department users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: 'Admin',
      office: 'Office',
      department: 'Department User',
      hod: 'Head of Department',
      vice_principal: 'Vice Principal',
      principal: 'Principal',
      auditor: 'Auditor'
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: '#dc3545',
      office: '#007bff',
      department: '#28a745',
      hod: '#ffc107',
      vice_principal: '#6f42c1',
      principal: '#fd7e14',
      auditor: '#20c997'
    };
    return colors[role] || '#6c757d';
  };

  if (loading) {
    return (
      <div className="department-users-container">
        <div className="loading">Loading department users...</div>
      </div>
    );
  }

  if (!user?.department) {
    return (
      <div className="department-users-container">
        <div className="no-department">
          <h2>No Department Assigned</h2>
          <p>You are not assigned to any department. Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="department-users-container">
      <div className="department-users-header">
        <div className="header-info">
          <h1>Department Users</h1>
          {department && (
            <div className="department-info">
              <h2>{department.name}</h2>
              <span className="dept-code">{department.code}</span>
            </div>
          )}
        </div>
        <div className="user-count">
          <span className="count-number">{departmentUsers.length}</span>
          <span className="count-label">Users</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search users..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <select
            name="isActive"
            value={filters.isActive}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="users-grid">
        {departmentUsers.map((user) => (
          <div key={user._id} className="user-card">
            <div className="user-avatar">
              <div className="avatar-circle">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="user-details">
              <h3 className="user-name">{user.name}</h3>
              <p className="user-email">{user.email}</p>
              <div className="user-role">
                <span 
                  className="role-badge"
                  style={{ backgroundColor: getRoleColor(user.role) }}
                >
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <div className="user-status">
                <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="user-meta">
                <p className="last-login">
                  Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </p>
                <p className="user-id">ID: {user._id}</p>
              </div>
            </div>
            <div className="user-actions">
              {user.role === 'hod' && (
                <div className="hod-badge">
                  <i className="fas fa-crown"></i>
                  HOD
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {departmentUsers.length === 0 && (
        <div className="no-users">
          <div className="no-users-icon">
            <i className="fas fa-users"></i>
          </div>
          <h3>No Users Found</h3>
          <p>No users found in your department matching the current filters.</p>
        </div>
      )}

      <div className="department-stats">
        <div className="stats-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{departmentUsers.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stat-icon">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">
              {departmentUsers.filter(u => u.isActive).length}
            </div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stat-icon">
            <i className="fas fa-user-times"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">
              {departmentUsers.filter(u => !u.isActive).length}
            </div>
            <div className="stat-label">Inactive Users</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stat-icon">
            <i className="fas fa-crown"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">
              {departmentUsers.filter(u => u.role === 'hod').length}
            </div>
            <div className="stat-label">HODs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentUsers;
