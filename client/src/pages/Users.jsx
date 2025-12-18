import React, { useState, useEffect } from 'react';
import { usersAPI, departmentsAPI } from '../services/api';
import Tooltip from '../components/Tooltip/Tooltip';
import PageHeader from '../components/Common/PageHeader';
import StatCard from '../components/Common/StatCard';
import { UserPlus, Pencil, Trash2, X } from 'lucide-react';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    isActive: true
  });
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: '',
    department: ''
  });

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'office', label: 'Office' },
    { value: 'department', label: 'Department User' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'vice_principal', label: 'Vice Principal' },
    { value: 'principal', label: 'Principal' },
    { value: 'auditor', label: 'Auditor' }
  ];

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchStats();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.isActive) params.isActive = filters.isActive;
      if (filters.department) params.department = filters.department;

      const response = await usersAPI.getUsers(params);
      setUsers(response.data.data.users);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getDepartments();
      setDepartments(response.data.data.departments);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await usersAPI.getUserStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /* 
   * Updated formData logic to include password fields 
   */
  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: '',
      department: '',
      password: '',
      confirmPassword: '',
      isActive: true
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!editingUser) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    try {
      if (editingUser) {
        await usersAPI.updateUser(editingUser._id, formData);
      } else {
        await usersAPI.createUser(formData);
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', role: '', department: '', password: '', confirmPassword: '', isActive: true });
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
      console.error('Error saving user:', err);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      password: '', // Not editing password here
      confirmPassword: '',
      isActive: user.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.deleteUser(id);
        fetchUsers();
        fetchStats();
      } catch (err) {
        setError('Failed to delete user');
        console.error('Error deleting user:', err);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: '', department: '', password: '', confirmPassword: '', isActive: true });
    setError(null);
  };

  const getRoleLabel = (role) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption ? roleOption.label : role;
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
      <div className="users-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <PageHeader 
        title="Users Management" 
        subtitle="Manage system users and access roles"
      >
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleAddUser}>
            <UserPlus size={18} /> Add New User
          </button>
        </div>
      </PageHeader>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers} 
            icon={<UserPlus size={24} />} // Reuse UserPlus or just Users from lucide
            color="var(--primary)"
          />
          <StatCard 
            title="Active Users" 
            value={stats.activeUsers} 
            icon={<UserPlus size={24} />}
            color="var(--success)"
          />
          <StatCard 
            title="Inactive Users" 
            value={stats.inactiveUsers} 
            icon={<UserPlus size={24} />}
            color="var(--warning)"
          />
          <StatCard 
            title="Roles" 
            value={Object.keys(stats.roleStats || {}).length} 
            icon={<UserPlus size={24} />}
            color="var(--info)"
          />
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
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Roles</option>
            {roleOptions.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
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
        <div className="filter-group">
          <select
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-id">ID: {user._id}</div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span
                    className="role-badge"
                    style={{ backgroundColor: getRoleColor(user.role) }}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td>
                  {user.departmentInfo ? (
                    <div className="dept-info">
                      <div className="dept-name">{user.departmentInfo.name}</div>
                      <div className="dept-code">{user.departmentInfo.code}</div>
                    </div>
                  ) : (
                    <span className="no-dept">No department</span>
                  )}
                </td>
                <td>
                  <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td>
                  <div className="action-buttons">
                    <Tooltip text="Edit User" position="top">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(user)}
                      >
                        <Pencil size={16} />
                      </button>
                    </Tooltip>
                    {user.role !== 'admin' && (
                      <Tooltip text="Delete User" position="top">
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(user._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
              <button className="close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            
            {!editingUser && (
              <div className="modal-intro">
                <h3>CBMS Create Account</h3>
                <p>Join the College Budget Management System</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Role</option>
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              {['department', 'hod'].includes(formData.role) && (
                <div className="form-group">
                  <label htmlFor="department">Department *</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {!editingUser && (
                <>
                  <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password *</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active User
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
