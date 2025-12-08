import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBudget: 0,
    spentAmount: 0,
    remainingAmount: 0,
    utilizationPercentage: 0,
    pendingApprovals: 0,
    totalExpenditures: 0,
  });
  const [recentExpenditures, setRecentExpenditures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalBudget: 5000000,
        spentAmount: 3200000,
        remainingAmount: 1800000,
        utilizationPercentage: 64,
        pendingApprovals: 12,
        totalExpenditures: 45,
      });

      setRecentExpenditures([
        {
          id: 1,
          billNumber: 'BILL-001',
          amount: 25000,
          partyName: 'ABC Suppliers',
          status: 'approved',
          date: '2024-01-15',
        },
        {
          id: 2,
          billNumber: 'BILL-002',
          amount: 15000,
          partyName: 'XYZ Services',
          status: 'pending',
          date: '2024-01-14',
        },
        {
          id: 3,
          billNumber: 'BILL-003',
          amount: 35000,
          partyName: 'DEF Equipment',
          status: 'verified',
          date: '2024-01-13',
        },
      ]);

      setIsLoading(false);
    }, 1000);
  }, []);

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'admin':
        return {
          title: 'System Administration Dashboard',
          subtitle: 'Manage users, departments, and system settings',
          quickActions: [
            { label: 'Manage Users', icon: '👥', path: '/users' },
            { label: 'Departments', icon: '🏢', path: '/departments' },
            { label: 'Budget Heads', icon: '💰', path: '/budget-heads' },
            { label: 'System Settings', icon: '⚙️', path: '/settings' },
          ],
        };
      case 'office':
        return {
          title: 'Finance Office Dashboard',
          subtitle: 'Manage budget allocations and approvals',
          quickActions: [
            { label: 'Budget Allocations', icon: '📋', path: '/allocations' },
            { label: 'Pending Approvals', icon: '✅', path: '/approvals' },
            { label: 'Generate Reports', icon: '📈', path: '/reports' },
            { label: 'Department Overview', icon: '📊', path: '/department-overview' },
          ],
        };
      case 'department':
        return {
          title: 'Department Dashboard',
          subtitle: `Welcome, ${user?.name}. Manage your department expenditures.`,
          quickActions: [
            { label: 'Submit Expenditure', icon: '➕', path: '/submit-expenditure' },
            { label: 'My Expenditures', icon: '💸', path: '/expenditures' },
            { label: 'Budget Status', icon: '📊', path: '/budget-status' },
            { label: 'View Reports', icon: '📈', path: '/reports' },
          ],
        };
      case 'hod':
        return {
          title: 'Head of Department Dashboard',
          subtitle: 'Review and verify departmental expenditures',
          quickActions: [
            { label: 'Department Expenditures', icon: '📝', path: '/department-expenditures' },
            { label: 'Pending Verifications', icon: '✅', path: '/approvals' },
            { label: 'Department Reports', icon: '📈', path: '/reports' },
            { label: 'Budget Overview', icon: '📊', path: '/budget-overview' },
          ],
        };
      case 'vice_principal':
      case 'principal':
        return {
          title: 'Management Dashboard',
          subtitle: 'Oversee college budget and expenditures',
          quickActions: [
            { label: 'High-Value Approvals', icon: '✅', path: '/approvals' },
            { label: 'Consolidated Reports', icon: '📈', path: '/reports' },
            { label: 'Budget Overview', icon: '📊', path: '/consolidated-view' },
            { label: 'Department Analysis', icon: '📋', path: '/department-analysis' },
          ],
        };
      case 'auditor':
        return {
          title: 'Audit Dashboard',
          subtitle: 'Review financial records and audit trails',
          quickActions: [
            { label: 'Audit Logs', icon: '🔍', path: '/audit-logs' },
            { label: 'Financial Reports', icon: '📈', path: '/reports' },
            { label: 'Expenditure Analysis', icon: '📊', path: '/expenditure-analysis' },
            { label: 'Compliance Check', icon: '✅', path: '/compliance' },
          ],
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'Welcome to CBMS',
          quickActions: [],
        };
    }
  };

  const content = getRoleSpecificContent();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      verified: '#17a2b8',
      approved: '#28a745',
      rejected: '#dc3545',
    };
    return colors[status] || '#6c757d';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      verified: '✅',
      approved: '✅',
      rejected: '❌',
    };
    return icons[status] || '❓';
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1 className="page-title">{content.title}</h1>
        <p className="page-subtitle">{content.subtitle}</p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {content.quickActions.map((action, index) => (
            <a key={index} href={action.path} className="action-card">
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Budget</h3>
            <p className="stat-value">{formatCurrency(stats.totalBudget)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <h3>Amount Spent</h3>
            <p className="stat-value">{formatCurrency(stats.spentAmount)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Remaining Budget</h3>
            <p className="stat-value">{formatCurrency(stats.remainingAmount)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Utilization</h3>
            <p className="stat-value">{stats.utilizationPercentage}%</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${stats.utilizationPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending Approvals</h3>
            <p className="stat-value">{stats.pendingApprovals}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Total Expenditures</h3>
            <p className="stat-value">{stats.totalExpenditures}</p>
          </div>
        </div>
      </div>

      {/* Recent Expenditures */}
      <div className="recent-expenditures">
        <h2>Recent Expenditures</h2>
        <div className="expenditures-table">
          <div className="table-header">
            <span>Bill Number</span>
            <span>Amount</span>
            <span>Party</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          {recentExpenditures.map((expenditure) => (
            <div key={expenditure.id} className="table-row">
              <span className="bill-number">{expenditure.billNumber}</span>
              <span className="amount">{formatCurrency(expenditure.amount)}</span>
              <span className="party">{expenditure.partyName}</span>
              <span 
                className="status"
                style={{ color: getStatusColor(expenditure.status) }}
              >
                {getStatusIcon(expenditure.status)} {expenditure.status}
              </span>
              <span className="date">{expenditure.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
