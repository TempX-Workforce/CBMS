import React, { useState, useEffect } from 'react';
import { usersAPI, departmentsAPI } from '../services/api';
import PageHeader from '../components/Common/PageHeader';
import { UserPlus, Pencil, Trash2, X, Search, Filter, Shield, Check, RotateCw, MoreHorizontal } from 'lucide-react';
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
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: '',
    department: ''
  });

  // New state for selected user permissions view
  const [selectedUserPermissions, setSelectedUserPermissions] = useState(null);

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
      // Select first user for permissions view by default if available
      if (response.data.data.users.length > 0 && !selectedUserPermissions) {
        setSelectedUserPermissions(response.data.data.users[0]);
      }
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      password: '',
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
      } catch (err) {
        setError('Failed to delete user');
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

  const getRoleColorClass = (role) => {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'hod': return 'role-hod';
      case 'department': return 'role-dept';
      case 'office': return 'role-office';
      default: return 'role-default';
    }
  };

  // Helper to generate initials
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  const getPermissions = (user) => {
    // Return user-specific permissions if they exist, otherwise default based on role (or empty)
    if (user.permissions && Object.keys(user.permissions).length > 0) {
      return user.permissions;
    }
    // Fallback or default structure
    return {
      canApprove: false,
      exportReports: false,
      manageBudgets: false,
      manageUsers: false,
      superAdmin: false
    };
  };

  const permissions = selectedUserPermissions ? getPermissions(selectedUserPermissions) : {};

  const handlePermissionToggle = async (permissionKey) => {
    if (!selectedUserPermissions) return;

    const currentPermissions = selectedUserPermissions.permissions || {};
    const updatedPermissions = {
      ...currentPermissions,
      [permissionKey]: !currentPermissions[permissionKey]
    };

    // Optimistic UI update
    const updatedUser = { ...selectedUserPermissions, permissions: updatedPermissions };
    setSelectedUserPermissions(updatedUser);

    // Update in users list as well to reflect if we switch back and forth
    setUsers(prevUsers => prevUsers.map(u =>
      u._id === updatedUser._id ? updatedUser : u
    ));

    try {
      await usersAPI.updateUser(selectedUserPermissions._id, { permissions: updatedPermissions });
    } catch (err) {
      console.error('Failed to update permission:', err);
      setError('Failed to update permission');
      // Revert on failure
      fetchUsers();
    }
  };

  const handleStatusToggle = async (user) => {
    const updatedUser = { ...user, isActive: !user.isActive };

    // Optimistic UI update
    setUsers(users.map(u => u._id === user._id ? updatedUser : u));
    if (selectedUserPermissions?._id === user._id) {
      setSelectedUserPermissions(updatedUser);
    }

    try {
      await usersAPI.updateUser(user._id, { isActive: !user.isActive });
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update user status');
      fetchUsers(); // Revert
    }
  };

  const handleQuickAdd = (user) => {
    // For now, let's treat "+" as a shortcut to add a similar user (same role/dept)
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: user.role,
      department: user.department || '',
      password: '',
      confirmPassword: '',
      isActive: true
    });
    setShowModal(true);
  };

  return (
    <>
      <div className="users-content-container">

        {/* Header Section */}
        <div className="users-page-header">
          <div className="header-title">
            <h1>User Management</h1>
          </div>
          <button className="btn-add-user" onClick={handleAddUser}>
            <span className="btn-icon">+</span> Add New User
          </button>
        </div>

        {/* Filters Section */}
        <div className="users-filters-bar">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="search-input"
            />
          </div>

          <div className="filter-dropdowns">
            <div className="filter-item">
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Filter by Role</option>
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <select
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Filter by Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Redesigned Button Placeholders matching the image */}
            <button className="filter-btn-outline disabled">Filter by Department</button>
          </div>
        </div>

        {/* Permissions / Main Content Split */}
        <div className="main-content-area">
          <div className="table-section">
            <h3 className="section-title">Permissions</h3>

            <div className="users-table-wrapper">
              <table className="modern-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Status Action</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="text-center p-4">Loading...</td></tr>
                  ) : users.map((user) => (
                    <tr
                      key={user._id}
                      className={selectedUserPermissions?._id === user._id ? 'selected-row' : ''}
                      onClick={() => setSelectedUserPermissions(user)}
                    >
                      <td>
                        <div className="user-profile-cell">
                          <div className="user-avatar">
                            {getInitials(user.name)}
                          </div>
                          <div className="user-details">
                            <span className="user-name">{user.name}</span>
                            <span className="user-email">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-pill ${getRoleColorClass(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className="dept-text">{user.departmentInfo?.name || 'Admin'}</span>
                      </td>
                      <td>
                        <span className="status-text">{user.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td>
                        {/* Toggle Switch Simulation */}
                        <div
                          className={`status-toggle ${user.isActive ? 'on' : 'off'}`}
                          onClick={(e) => { e.stopPropagation(); handleStatusToggle(user); }}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <div className="toggle-handle"></div>
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="action-icon edit" onClick={(e) => { e.stopPropagation(); handleEdit(user); }} title="Edit User">
                            <Pencil size={15} />
                          </button>
                          {user.role !== 'admin' && (
                            <button className="action-icon delete" onClick={(e) => { e.stopPropagation(); handleDelete(user._id); }} title="Delete User">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Visual Permissions Footer/Panel */}
            {selectedUserPermissions && (
              <div className="permissions-footer">
                <div className="permission-group">
                  <h4>Permissions</h4>
                  <div className="permission-check-list">
                    <label className={permissions.canApprove ? 'checked' : ''}>
                      <span className="check-box" onClick={() => handlePermissionToggle('canApprove')}>
                        {permissions.canApprove && <Check size={12} />}
                      </span>
                      Can Approve
                    </label>
                    <label className={permissions.exportReports ? 'checked' : ''}>
                      <span className="check-box" onClick={() => handlePermissionToggle('exportReports')}>
                        {permissions.exportReports && <Check size={12} />}
                      </span>
                      Can Export Reports
                    </label>
                    <label className={permissions.manageBudgets ? 'checked' : ''}>
                      <span className="check-box" onClick={() => handlePermissionToggle('manageBudgets')}>
                        {permissions.manageBudgets && <Check size={12} />}
                      </span>
                      Manage Budgets
                    </label>
                  </div>
                </div>
                <div className="permission-group">
                  <h4>Additional Access</h4>
                  <div className="permission-check-list">
                    <label className={permissions.manageUsers ? 'checked' : ''}>
                      <span className="check-box" onClick={() => handlePermissionToggle('manageUsers')}>
                        {permissions.manageUsers && <Check size={12} />}
                      </span>
                      Manage Users
                    </label>
                    <label className={permissions.superAdmin ? 'checked' : ''}>
                      <span className="check-box" onClick={() => handlePermissionToggle('superAdmin')}>
                        {permissions.superAdmin && <Check size={12} />}
                      </span>
                      Super Admin Access
                    </label>
                  </div>
                </div>
                <div className="pagination-info">
                  <span>9600 / 1900</span> {/* Dummy data from image */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal - Kept Functional */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
                <button className="close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                {/* Reuse existing form fields logic for brevity, structure is same as before but styled by global CSS */}
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} required>
                    <option value="">Select Role</option>
                    {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                {['department', 'hod'].includes(formData.role) && (
                  <div className="form-group">
                    <label>Department</label>
                    <select name="department" value={formData.department} onChange={handleInputChange} required>
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
                {!editingUser && (
                  <>
                    <div className="form-group">
                      <label>Password</label>
                      <input type="password" name="password" value={formData.password} onChange={handleInputChange} required minLength={6} />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required minLength={6} />
                    </div>
                  </>
                )}
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingUser ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </>
  );
};

export default Users;
