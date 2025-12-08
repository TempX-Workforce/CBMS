import React, { useState, useEffect } from 'react';
import { allocationAPI, expenditureAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DepartmentDashboard.css';

const DepartmentDashboard = () => {
  const { user, updateProfile, logout } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('DepartmentDashboard useEffect - user:', user);
    console.log('DepartmentDashboard useEffect - user.department:', user?.department);
    if (user?.department) {
      fetchData();
    } else {
      console.log('No department found for user, setting loading to false');
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data for department:', user.department);
      
      const [allocationsResponse, expendituresResponse, statsResponse] = await Promise.all([
        allocationAPI.getAllocations({ departmentId: user.department }),
        expenditureAPI.getExpenditures({ departmentId: user.department }),
        allocationAPI.getAllocationStats({ departmentId: user.department })
      ]);
      
      console.log('Allocations response:', allocationsResponse.data);
      console.log('Expenditures response:', expendituresResponse.data);
      console.log('Stats response:', statsResponse.data);
      
      setAllocations(allocationsResponse.data.data.allocations);
      setExpenditures(expendituresResponse.data.data.expenditures);
      setStats(statsResponse.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch department data');
      console.error('Error fetching department data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      setRefreshing(true);
      const response = await authAPI.getProfile();
      const updatedUser = response.data.data.user;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update context
      await updateProfile(updatedUser);
      
      console.log('User data refreshed:', updatedUser);
    } catch (err) {
      console.error('Error refreshing user data:', err);
    } finally {
      setRefreshing(false);
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

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      approved: '#28a745',
      rejected: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="department-dashboard-container">
        <div className="loading">
          Loading department dashboard...
          <br />
          <small>User: {user?.name} | Department: {user?.department || 'None'}</small>
          <br />
          <button 
            className="btn btn-primary" 
            onClick={refreshUserData}
            disabled={refreshing}
            style={{ marginTop: '10px' }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh User Data'}
          </button>
        </div>
      </div>
    );
  }

  if (!user?.department) {
    return (
      <div className="department-dashboard-container">
        <div className="no-department">
          <h2>No Department Assigned</h2>
          <p>You are not assigned to any department. Please contact an administrator.</p>
          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn btn-primary" 
              onClick={refreshUserData}
              disabled={refreshing}
              style={{ marginRight: '10px' }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh User Data'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="department-dashboard-container">
      <div className="dashboard-header">
        <h1>Department Dashboard</h1>
        <p>Budget overview and expenditure tracking for your department</p>
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
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div className="stat-info">
              <div className="stat-number">{formatCurrency(stats.summary.totalAllocated)}</div>
              <div className="stat-label">Total Allocated</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-credit-card"></i>
            </div>
            <div className="stat-info">
              <div className="stat-number">{formatCurrency(stats.summary.totalSpent)}</div>
              <div className="stat-label">Total Spent</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-wallet"></i>
            </div>
            <div className="stat-info">
              <div className="stat-number">{formatCurrency(stats.summary.totalRemaining)}</div>
              <div className="stat-label">Remaining Budget</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-chart-pie"></i>
            </div>
            <div className="stat-info">
              <div className="stat-number">{stats.summary.utilizationPercentage}%</div>
              <div className="stat-label">Utilization</div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="budget-overview">
          <h2>Budget Overview by Head</h2>
          <div className="budget-cards">
            {allocations.map((allocation) => {
              const utilization = getUtilizationPercentage(allocation.allocatedAmount, allocation.spentAmount);
              return (
                <div key={allocation._id} className="budget-card">
                  <div className="budget-header">
                    <h3 className="budget-head-name">{allocation.budgetHeadName}</h3>
                    <span className="budget-head-code">{allocation.budgetHeadCode}</span>
                  </div>
                  
                  <div className="budget-amounts">
                    <div className="amount-row">
                      <span className="label">Allocated:</span>
                      <span className="amount">{formatCurrency(allocation.allocatedAmount)}</span>
                    </div>
                    <div className="amount-row">
                      <span className="label">Spent:</span>
                      <span className="amount spent">{formatCurrency(allocation.spentAmount)}</span>
                    </div>
                    <div className="amount-row">
                      <span className="label">Remaining:</span>
                      <span className="amount remaining">{formatCurrency(allocation.remainingAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="utilization-bar">
                    <div className="utilization-fill" style={{
                      width: `${utilization}%`,
                      backgroundColor: getUtilizationColor(utilization)
                    }}></div>
                    <span className="utilization-text">{utilization}%</span>
                  </div>
                  
                  <div className="budget-status">
                    {allocation.remainingAmount > 0 ? (
                      <span className="status available">
                        <i className="fas fa-check-circle"></i>
                        Budget Available
                      </span>
                    ) : (
                      <span className="status exhausted">
                        <i className="fas fa-exclamation-triangle"></i>
                        Budget Exhausted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="expenditure-history">
          <h2>Recent Expenditures</h2>
          <div className="expenditure-list">
            {expenditures.slice(0, 10).map((expenditure) => (
              <div key={expenditure._id} className="expenditure-item">
                <div className="expenditure-info">
                  <div className="bill-info">
                    <h4 className="bill-number">{expenditure.billNumber}</h4>
                    <span className="budget-head">{expenditure.budgetHeadName}</span>
                  </div>
                  <div className="expenditure-details">
                    <span className="party-name">{expenditure.partyName}</span>
                    <span className="bill-date">{formatDate(expenditure.billDate)}</span>
                  </div>
                </div>
                
                <div className="expenditure-amount">
                  <span className="amount">{formatCurrency(expenditure.billAmount)}</span>
                </div>
                
                <div className="expenditure-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(expenditure.status) }}
                  >
                    {expenditure.status.charAt(0).toUpperCase() + expenditure.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {expenditures.length === 0 && (
            <div className="no-expenditures">
              <div className="no-expenditures-icon">
                <i className="fas fa-receipt"></i>
              </div>
              <h3>No Expenditures</h3>
              <p>No expenditures have been submitted yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="btn btn-primary">
            <i className="fas fa-plus"></i>
            Submit New Expenditure
          </button>
          <button className="btn btn-secondary">
            <i className="fas fa-list"></i>
            View All Expenditures
          </button>
          <button className="btn btn-secondary">
            <i className="fas fa-download"></i>
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;
