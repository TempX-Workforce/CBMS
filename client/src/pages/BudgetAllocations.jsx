import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { allocationAPI, departmentsAPI, budgetHeadsAPI } from '../services/api';
import Tooltip from '../components/Tooltip/Tooltip';
import { Plus, IndianRupee, CreditCard, Wallet, PieChart, Pencil, Trash2, X } from 'lucide-react';
import './BudgetAllocations.css';

const BudgetAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [budgetHeads, setBudgetHeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      if (filters.departmentId) allocationParams.department = filters.departmentId;
      if (filters.budgetHeadId) allocationParams.budgetHead = filters.budgetHeadId;
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
        <Link to="/allocations/add" className="btn btn-primary">
          <Plus size={18} /> Add Allocation
        </Link>
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
              <IndianRupee size={32} />
            </div>
            <div className="stat-info">
              <div className="stat-number">₹{stats.summary?.totalAllocated?.toLocaleString() || '0'}</div>
              <div className="stat-label">Total Allocated</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <CreditCard size={32} />
            </div>
            <div className="stat-info">
              <div className="stat-number">₹{stats.summary?.totalSpent?.toLocaleString() || '0'}</div>
              <div className="stat-label">Total Spent</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Wallet size={32} />
            </div>
            <div className="stat-info">
              <div className="stat-number">₹{stats.summary?.totalRemaining?.toLocaleString() || '0'}</div>
              <div className="stat-label">Remaining Budget</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <PieChart size={32} />
            </div>
            <div className="stat-info">
              <div className="stat-number">{stats.summary?.utilizationPercentage || '0'}%</div>
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
            {(stats?.financialYears || []).map(year => (
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
                  <td className="amount">₹{allocation.allocatedAmount?.toLocaleString() || '0'}</td>
                  <td className="amount">₹{allocation.spentAmount?.toLocaleString() || '0'}</td>
                  <td className="amount">₹{allocation.remainingAmount?.toLocaleString() || '0'}</td>
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
                        <Link
                          to={`/allocations/edit/${allocation._id}`}
                          className="btn btn-sm btn-secondary"
                        >
                          <Pencil size={16} />
                        </Link>
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

    </div>
  );
};

export default BudgetAllocations;