import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenditureAPI, allocationAPI } from '../services/api';
import {
  LuUsers,
  LuBuilding2,
  LuWallet,
  LuSettings,
  LuClipboardList,
  LuCheckSquare,
  LuLineChart,
  LuPlusCircle,
  LuCalculator,
  LuFileText,
  LuSearch,
  LuLayoutDashboard,
  LuClock,
  LuTrendingUp,
  LuXCircle,
  LuCheckCircle2
} from 'react-icons/lu';
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
    fetchDashboardData();
  }, []);


  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const [statsRes, expendituresRes, allocationStatsRes] = await Promise.all([
        expenditureAPI.getExpenditureStats({ financialYear: '2024-25' }),
        expenditureAPI.getExpenditures({ limit: 5 }),
        allocationAPI.getAllocationStats({ financialYear: '2024-25' })
      ]);

      const statsData = statsRes.data.data.summary;
      const allocationData = allocationStatsRes.data.data.summary;

      // Use real budget data from allocations instead of hardcoded value
      const totalBudget = allocationData.totalAllocated || 0;
      const spentAmount = statsData.totalAmount || 0;
      const remainingAmount = totalBudget - spentAmount;
      const utilizationPercentage = totalBudget > 0 ? Math.round((spentAmount / totalBudget) * 100) : 0;

      setStats({
        totalBudget,
        spentAmount,
        remainingAmount,
        utilizationPercentage,
        pendingApprovals: expendituresRes.data.data.expenditures.filter(e => e.status === 'pending').length,
        totalExpenditures: statsData.totalExpenditures || 0,
      });

      setRecentExpenditures(expendituresRes.data.data.expenditures.map(exp => ({
        id: exp._id,
        billNumber: exp.billNumber,
        amount: exp.billAmount,
        partyName: exp.partyName,
        status: exp.status,
        date: new Date(exp.billDate).toLocaleDateString('en-IN')
      })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'admin':
        return {
          title: 'System Administration Dashboard',
          subtitle: 'Manage users, departments, and system settings',
          quickActions: [
            { label: 'Manage Users', icon: <LuUsers />, path: '/users' },
            { label: 'Departments', icon: <LuBuilding2 />, path: '/departments' },
            { label: 'Budget Heads', icon: <LuWallet />, path: '/budget-heads' },
            { label: 'System Settings', icon: <LuSettings />, path: '/settings' },
          ],
        };
      case 'office':
        return {
          title: 'Finance Office Dashboard',
          subtitle: 'Manage budget allocations and approvals',
          quickActions: [
            { label: 'Budget Allocations', icon: <LuClipboardList />, path: '/allocations' },
            { label: 'Pending Approvals', icon: <LuCheckSquare />, path: '/approvals' },
            { label: 'Generate Reports', icon: <LuFileText />, path: '/reports' },
            { label: 'Department Overview', icon: <LuLayoutDashboard />, path: '/department-overview' },
          ],
        };
      case 'department':
        return {
          title: 'Department Dashboard',
          subtitle: `Welcome, ${user?.name}. Manage your department expenditures.`,
          quickActions: [
            { label: 'Submit Expenditure', icon: <LuPlusCircle />, path: '/submit-expenditure' },
            { label: 'My Expenditures', icon: <LuCalculator />, path: '/expenditures' },
            { label: 'Budget Status', icon: <LuLineChart />, path: '/budget-status' },
            { label: 'View Reports', icon: <LuFileText />, path: '/reports' },
          ],
        };
      case 'hod':
        return {
          title: 'Head of Department Dashboard',
          subtitle: 'Review and verify departmental expenditures',
          quickActions: [
            { label: 'Department Expenditures', icon: <LuFileText />, path: '/department-expenditures' },
            { label: 'Pending Verifications', icon: <LuCheckSquare />, path: '/approvals' },
            { label: 'Department Reports', icon: <LuLineChart />, path: '/reports' },
            { label: 'Budget Overview', icon: <LuTrendingUp />, path: '/budget-overview' },
          ],
        };
      case 'vice_principal':
      case 'principal':
        return {
          title: 'Management Dashboard',
          subtitle: 'Oversee college budget and expenditures',
          quickActions: [
            { label: 'High-Value Approvals', icon: <LuCheckSquare />, path: '/approvals' },
            { label: 'Consolidated Reports', icon: <LuFileText />, path: '/reports' },
            { label: 'Budget Overview', icon: <LuLineChart />, path: '/consolidated-view' },
            { label: 'Department Analysis', icon: <LuClipboardList />, path: '/department-analysis' },
          ],
        };
      case 'auditor':
        return {
          title: 'Audit Dashboard',
          subtitle: 'Review financial records and audit trails',
          quickActions: [
            { label: 'Audit Logs', icon: <LuSearch />, path: '/audit-logs' },
            { label: 'Financial Reports', icon: <LuFileText />, path: '/reports' },
            { label: 'Expenditure Analysis', icon: <LuLineChart />, path: '/expenditure-analysis' },
            { label: 'Compliance Check', icon: <LuCheckSquare />, path: '/compliance' },
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
      pending: <LuClock />,
      verified: <LuCheckCircle2 />,
      approved: <LuCheckCircle2 />,
      rejected: <LuXCircle />,
    };
    return icons[status] || <LuClock />;
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
          <div className="stat-icon"><LuWallet size={32} /></div>
          <div className="stat-content">
            <h3>Total Budget</h3>
            <p className="stat-value">{formatCurrency(stats.totalBudget)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><LuCalculator size={32} /></div>
          <div className="stat-content">
            <h3>Amount Spent</h3>
            <p className="stat-value">{formatCurrency(stats.spentAmount)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><LuTrendingUp size={32} /></div>
          <div className="stat-content">
            <h3>Remaining Budget</h3>
            <p className="stat-value">{formatCurrency(stats.remainingAmount)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><LuLineChart size={32} /></div>
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
          <div className="stat-icon"><LuClock size={32} /></div>
          <div className="stat-content">
            <h3>Pending Approvals</h3>
            <p className="stat-value">{stats.pendingApprovals}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><LuClipboardList size={32} /></div>
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
