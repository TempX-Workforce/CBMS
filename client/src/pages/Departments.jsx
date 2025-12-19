import React, { useState, useEffect } from 'react';
import { departmentsAPI, usersAPI } from '../services/api';
import Tooltip from '../components/Tooltip/Tooltip';
import PageHeader from '../components/Common/PageHeader';
import StatCard from '../components/Common/StatCard';
import { Plus, Pencil, Trash2, X, Building, Users as UsersIcon } from 'lucide-react';
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
  const [hodUsers, setHodUsers] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDepartments();
    fetchStats();
    fetchHODs();
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

  const fetchHODs = async () => {
    try {
      const response = await usersAPI.getUsersByRole('hod');
      if (response.data.success) {
        setHodUsers(response.data.data.users);
      }
    } catch (err) {
      console.error('Error fetching HODs:', err);
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
      const submitData = { ...formData };
      if (!submitData.hod) submitData.hod = null;

      if (editingDepartment) {
        await departmentsAPI.updateDepartment(editingDepartment._id, submitData);
      } else {
        await departmentsAPI.createDepartment(submitData);
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
      <PageHeader 
        title="Departments Management" 
        subtitle="Manage academic and administrative departments"
      >
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={18} /> Add Department
        </button>
      </PageHeader>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <StatCard 
            title="Total Departments" 
            value={stats.totalDepartments} 
            icon={<Building size={24} />} 
            color="var(--primary)"
          />
          <StatCard 
            title="Active Departments" 
            value={stats.activeDepartments} 
            icon={<Building size={24} />}
            color="var(--success)"
          />
          <StatCard 
            title="With HOD" 
            value={stats.departmentsWithHOD} 
            icon={<UsersIcon size={24} />}
            color="var(--info)"
          />
          <StatCard 
            title="Without HOD" 
            value={stats.departmentsWithoutHOD} 
            icon={<UsersIcon size={24} />}
            color="var(--warning)"
          />
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
                    <Tooltip text="Edit Department" position="top">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(dept)}
                      >
                        <Pencil size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip text="Delete Department" position="top">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(dept._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </Tooltip>
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
                <X size={20} />
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
                  {hodUsers.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
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
