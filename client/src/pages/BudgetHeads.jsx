import React, { useState, useEffect } from 'react';
import { budgetHeadsAPI } from '../services/api';
import './BudgetHeads.css';

const BudgetHeads = () => {
  const [budgetHeads, setBudgetHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBudgetHead, setEditingBudgetHead] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'Other'
  });
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    isActive: ''
  });

  const categories = [
    'Academic',
    'Infrastructure', 
    'Personnel',
    'Equipment',
    'Operations',
    'Research',
    'Administrative',
    'Student Services',
    'Marketing',
    'Other'
  ];

  useEffect(() => {
    fetchBudgetHeads();
    fetchStats();
  }, [filters]);

  const fetchBudgetHeads = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.isActive) params.isActive = filters.isActive;
      
      const response = await budgetHeadsAPI.getBudgetHeads(params);
      setBudgetHeads(response.data.data.budgetHeads);
      setError(null);
    } catch (err) {
      setError('Failed to fetch budget heads');
      console.error('Error fetching budget heads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await budgetHeadsAPI.getBudgetHeadStats();
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBudgetHead) {
        await budgetHeadsAPI.updateBudgetHead(editingBudgetHead._id, formData);
      } else {
        await budgetHeadsAPI.createBudgetHead(formData);
      }
      
      setShowModal(false);
      setEditingBudgetHead(null);
      setFormData({ name: '', code: '', description: '', category: 'Other' });
      fetchBudgetHeads();
      fetchStats();
    } catch (err) {
      setError('Failed to save budget head');
      console.error('Error saving budget head:', err);
    }
  };

  const handleEdit = (budgetHead) => {
    setEditingBudgetHead(budgetHead);
    setFormData({
      name: budgetHead.name,
      code: budgetHead.code,
      description: budgetHead.description || '',
      category: budgetHead.category
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget head?')) {
      try {
        await budgetHeadsAPI.deleteBudgetHead(id);
        fetchBudgetHeads();
        fetchStats();
      } catch (err) {
        setError('Failed to delete budget head');
        console.error('Error deleting budget head:', err);
      }
    }
  };

  const openModal = () => {
    setEditingBudgetHead(null);
    setFormData({ name: '', code: '', description: '', category: 'Other' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBudgetHead(null);
    setFormData({ name: '', code: '', description: '', category: 'Other' });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Academic': '#28a745',
      'Infrastructure': '#007bff',
      'Personnel': '#ffc107',
      'Equipment': '#17a2b8',
      'Operations': '#6f42c1',
      'Research': '#fd7e14',
      'Administrative': '#6c757d',
      'Student Services': '#20c997',
      'Marketing': '#e83e8c',
      'Other': '#6c757d'
    };
    return colors[category] || '#6c757d';
  };

  if (loading) {
    return (
      <div className="budget-heads-container">
        <div className="loading">Loading budget heads...</div>
      </div>
    );
  }

  return (
    <div className="budget-heads-container">
      <div className="budget-heads-header">
        <h1>Budget Heads Management</h1>
        <button className="btn btn-primary" onClick={openModal}>
          <i className="fas fa-plus"></i> Add Budget Head
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
            <div className="stat-number">{stats.totalBudgetHeads}</div>
            <div className="stat-label">Total Budget Heads</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.activeBudgetHeads}</div>
            <div className="stat-label">Active Budget Heads</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.inactiveBudgetHeads}</div>
            <div className="stat-label">Inactive Budget Heads</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Object.keys(stats.categoryStats).length}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search budget heads..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
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
      </div>

      <div className="budget-heads-grid">
        {budgetHeads.map((head) => (
          <div key={head._id} className="budget-head-card">
            <div className="card-header">
              <div className="head-info">
                <h3 className="head-name">{head.name}</h3>
                <span className="head-code">{head.code}</span>
              </div>
              <div className="head-status">
                <span className={`status ${head.isActive ? 'active' : 'inactive'}`}>
                  {head.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="card-body">
              <div className="head-category">
                <span 
                  className="category-badge"
                  style={{ backgroundColor: getCategoryColor(head.category) }}
                >
                  {head.category}
                </span>
              </div>
              
              <p className="head-description">
                {head.description || 'No description provided'}
              </p>
              
              <div className="head-meta">
                <p className="created-date">
                  Created: {new Date(head.createdAt).toLocaleDateString()}
                </p>
                <p className="head-id">ID: {head._id}</p>
              </div>
            </div>
            
            <div className="card-actions">
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => handleEdit(head)}
              >
                <i className="fas fa-edit"></i> Edit
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(head._id)}
              >
                <i className="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {budgetHeads.length === 0 && (
        <div className="no-budget-heads">
          <div className="no-budget-heads-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <h3>No Budget Heads Found</h3>
          <p>No budget heads found matching the current filters.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingBudgetHead ? 'Edit Budget Head' : 'Add New Budget Head'}</h2>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">Budget Head Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Academic Expenses"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="code">Budget Head Code *</label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., ACAD"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Budget head description..."
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBudgetHead ? 'Update Budget Head' : 'Create Budget Head'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetHeads;
