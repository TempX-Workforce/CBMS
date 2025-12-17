import React, { useState, useEffect } from 'react';
import { allocationAPI, departmentsAPI, budgetHeadsAPI } from '../services/api';
import Tooltip from '../components/Tooltip/Tooltip';
import { Plus, DollarSign, CreditCard, Wallet, PieChart, Pencil, Trash2, X } from 'lucide-react';
import './BudgetAllocations.css';

const BudgetAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [budgetHeads, setBudgetHeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [formData, setFormData] = useState({
    departmentId: '',
    budgetHeadId: '',
    allocatedAmount: '',
    financialYear: '2024-25',
    remarks: ''
  });
  const [filters, setFilters] = useState({
    search: '',
    departmentId: '',
    budgetHeadId: '',
    financialYear: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch allocations with filters
      const allocationParams = {};
      if (filters.search) allocationParams.search = filters.search;
      if (filters.departmentId) allocationParams.departmentId = filters.departmentId;
      if (filters.budgetHeadId) allocationParams.budgetHeadId = filters.budgetHeadId;
      if (filters.financialYear) allocationParams.financialYear = filters.financialYear;

      const [allocationsResponse, departmentsResponse, budgetHeadsResponse, statsResponse] = await Promise.all([
        allocationAPI.getAllocations(allocationParams),
        departmentsAPI.getDepartments(),
        budgetHeadsAPI.getBudgetHeads(),
        allocationAPI.getAllocationStats()
      ]);

      setAllocations(allocationsResponse.data.data.allocations);
      setDepartments(departmentsResponse.data.data.departments);
      setBudgetHeads(budgetHeadsResponse.data.data.budgetHeads);
      setStats(statsResponse.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
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
      if (editingAllocation) {
        await allocationAPI.updateAllocation(editingAllocation._id, formData);
      } else {
        await allocationAPI.createAllocation(formData);
      }

      setShowModal(false);
      setEditingAllocation(null);
      setFormData({
        departmentId: '',
        budgetHeadId: '',
        allocatedAmount: '',
        financialYear: '2024-25',
        remarks: ''
      });
      fetchData();
    } catch (err) {
      setError('Failed to save allocation');
      console.error('Error saving allocation:', err);
    }
  };

  const handleEdit = (allocation) => {
    setEditingAllocation(allocation);
    setFormData({
      departmentId: allocation.departmentId,
      budgetHeadId: allocation.budgetHeadId,
      allocatedAmount: allocation.allocatedAmount.toString(),
      financialYear: allocation.financialYear,
      remarks: allocation.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this allocation?')) {
      try {
        await allocationAPI.deleteAllocation(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete allocation');
        console.error('Error deleting allocation:', err);
      }
    }
  };

  const openModal = () => {
    setEditingAllocation(null);
    setFormData({
      departmentId: '',
      budgetHeadId: '',
      allocatedAmount: '',
      financialYear: '2024-25',
      remarks: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAllocation(null);
    setFormData({
      departmentId: '',
      budgetHeadId: '',
      allocatedAmount: '',
      financialYear: '2024-25',
      remarks: ''
    });
  };

  const getUtilizationPercentage = (allocated, spent) => {
    if (allocated === 0) return 0;
    return Math.round((spent / allocated) * 100);
  };

  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return '#dc3545';
    if (percentage >= 75) return '#ffc107';
    if (percentage >= 50) return '#17a2b8';
    return '#28a745';
  };

  if (loading) {
    return (
      <div className="budget-allocations-container">
        <div className="loading">Loading budget allocations...</div>
      </div>
    );
  }

  return (
    <div className="budget-allocations-container">
      <div className="allocations-header">
        <h1>Budget Allocations Management</h1>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={18} /> Add Allocation
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
            <div className="stat-icon">
              <DollarSign size={32} />
            </div>
            <div className="stat-info">
              <div className="stat-number">₹{stats.summary.totalAllocated.toLocaleString()}</div>
              <div className="stat-label">Total Allocated</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <CreditCard size={32} />
            </div>
            <div className="stat-info">
              <div className="stat-number">₹{stats.summary.totalSpent.toLocaleString()}</div>
              <div className="stat-label">Total Spent</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Wallet size={32} />
            </div>
            <div className="stat-info">
              <div className="stat-number">₹{stats.summary.totalRemaining.toLocaleString()}</div>
              <div className="stat-label">Remaining Budget</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <PieChart size={32} />
            </div>
            <div className="stat-info">
              <div className="stat-number">{stats.summary.utilizationPercentage}%</div>
              <div className="stat-label">Utilization</div>
            </div>
          </div>
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search allocations..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <select
            name="departmentId"
            value={filters.departmentId}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <select
            name="budgetHeadId"
            value={filters.budgetHeadId}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Budget Heads</option>
            {budgetHeads.map(head => (
              <option key={head._id} value={head._id}>{head.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <select
            name="financialYear"
            value={filters.financialYear}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Financial Years</option>
            {stats?.financialYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="allocations-table-container">
        <table className="allocations-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Budget Head</th>
              <th>Financial Year</th>
              <th>Allocated Amount</th>
              <th>Spent Amount</th>
              <th>Remaining</th>
              <th>Utilization</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((allocation) => {
              const utilization = getUtilizationPercentage(allocation.allocatedAmount, allocation.spentAmount);
              return (
                <tr key={allocation._id}>
                  <td>
                    <div className="department-info">
                      <span className="dept-name">{allocation.departmentName}</span>
                      <span className="dept-code">{allocation.departmentId}</span>
                    </div>
                  </td>
                  <td>
                    <div className="budget-head-info">
                      <span className="head-name">{allocation.budgetHeadName}</span>
                      <span className="head-code">{allocation.budgetHeadCode}</span>
                    </div>
                  </td>
                  <td>{allocation.financialYear}</td>
                  <td className="amount">₹{allocation.allocatedAmount.toLocaleString()}</td>
                  <td className="amount">₹{allocation.spentAmount.toLocaleString()}</td>
                  <td className="amount">₹{allocation.remainingAmount.toLocaleString()}</td>
                  <td>
                    <div className="utilization-bar">
                      <div className="utilization-fill" style={{
                        width: `${utilization}%`,
                        backgroundColor: getUtilizationColor(utilization)
                      }}></div>
                      <span className="utilization-text">{utilization}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Tooltip text="Edit Allocation" position="top">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEdit(allocation)}
                        >
                          <Pencil size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip text="Delete Allocation" position="top">
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(allocation._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {allocations.length === 0 && (
        <div className="no-allocations">
          <div className="no-allocations-icon">
            <DollarSign size={48} />
          </div>
          <h3>No Allocations Found</h3>
          <p>No allocations found matching the current filters.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingAllocation ? 'Edit Allocation' : 'Add New Allocation'}</h2>
              <button className="close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="departmentId">Department *</label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="budgetHeadId">Budget Head *</label>
                <select
                  id="budgetHeadId"
                  name="budgetHeadId"
                  value={formData.budgetHeadId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Budget Head</option>
                  {budgetHeads.map(head => (
                    <option key={head._id} value={head._id}>{head.name} ({head.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="allocatedAmount">Allocated Amount *</label>
                  <input
                    type="number"
                    id="allocatedAmount"
                    name="allocatedAmount"
                    value={formData.allocatedAmount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="financialYear">Financial Year *</label>
                  <input
                    type="text"
                    id="financialYear"
                    name="financialYear"
                    value={formData.financialYear}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 2024-25"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="remarks">Remarks</label>
                <textarea
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Additional remarks..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAllocation ? 'Update Allocation' : 'Create Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetAllocations;