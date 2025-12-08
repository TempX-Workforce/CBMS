import React, { useState, useEffect } from 'react';
import { departmentsAPI } from '../services/api';
import './Departments.css';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    hod: ''
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDepartments();
    fetchStats();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsAPI.getDepartments();
      setDepartments(response.data.data.departments);
      setError(null);
    } catch (err) {
      setError('Failed to fetch departments');
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await departmentsAPI.getDepartmentStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await departmentsAPI.updateDepartment(editingDepartment._id, formData);
      } else {
        await departmentsAPI.createDepartment(formData);
      }
      
      setShowModal(false);
      setEditingDepartment(null);
      setFormData({ name: '', code: '', description: '', hod: '' });
      fetchDepartments();
      fetchStats();
    } catch (err) {
      setError('Failed to save department');
      console.error('Error saving department:', err);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      hod: department.hod || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await departmentsAPI.deleteDepartment(id);
        fetchDepartments();
        fetchStats();
      } catch (err) {
        setError('Failed to delete department');
        console.error('Error deleting department:', err);
      }
    }
  };

  const openModal = () => {
    setEditingDepartment(null);
    setFormData({ name: '', code: '', description: '', hod: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({ name: '', code: '', description: '', hod: '' });
  };

  if (loading) {
    return (
      <div className="departments-container">
        <div className="loading">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="departments-container">
      <div className="departments-header">
        <h1>Departments Management</h1>
        <button className="btn btn-primary" onClick={openModal}>
          <i className="fas fa-plus"></i> Add Department
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalDepartments}</div>
            <div className="stat-label">Total Departments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.activeDepartments}</div>
            <div className="stat-label">Active Departments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.departmentsWithHOD}</div>
            <div className="stat-label">With HOD</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.departmentsWithoutHOD}</div>
            <div className="stat-label">Without HOD</div>
          </div>
        </div>
      )}

      <div className="departments-table-container">
        <table className="departments-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Description</th>
              <th>HOD</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept._id}>
                <td>{dept.name}</td>
                <td>
                  <span className="dept-code">{dept.code}</span>
                </td>
                <td>{dept.description || '-'}</td>
                <td>
                  {dept.hodInfo ? (
                    <div className="hod-info">
                      <div className="hod-name">{dept.hodInfo.name}</div>
                      <div className="hod-email">{dept.hodInfo.email}</div>
                    </div>
                  ) : (
                    <span className="no-hod">No HOD assigned</span>
                  )}
                </td>
                <td>
                  <span className={`status ${dept.isActive ? 'active' : 'inactive'}`}>
                    {dept.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(dept)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(dept._id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
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
              <h2>{editingDepartment ? 'Edit Department' : 'Add New Department'}</h2>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">Department Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Computer Science"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="code">Department Code *</label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., CS"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Department description..."
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="hod">Head of Department (HOD)</label>
                <select
                  id="hod"
                  name="hod"
                  value={formData.hod}
                  onChange={handleInputChange}
                >
                  <option value="">Select HOD (Optional)</option>
                  <option value="1">Test Admin (admin@test.com)</option>
                  <option value="2">Test User (user@test.com)</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDepartment ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
