import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { allocationAPI, expenditureAPI, reportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import './GraphicalDashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const GraphicalDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [timeRange, setTimeRange] = useState('current');
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [allocationResponse, expenditureResponse, reportResponse] = await Promise.all([
        allocationAPI.getAllocations({ 
          departmentId: user.role === 'department' ? user.department : undefined,
          financialYear: timeRange === 'current' ? '2024-25' : '2023-24'
        }),
        expenditureAPI.getExpenditures({ 
          departmentId: user.role === 'department' ? user.department : undefined,
          status: 'approved'
        }),
        reportAPI.getDashboardReport({
          departmentId: user.role === 'department' ? user.department : undefined,
          financialYear: timeRange === 'current' ? '2024-25' : '2023-24'
        })
      ]);

      setDashboardData({
        allocations: allocationResponse.data.data.allocations || [],
        expenditures: expenditureResponse.data.data.expenditures || [],
        report: reportResponse.data.data || {}
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty data structure to prevent crashes
      setDashboardData({
        allocations: [],
        expenditures: [],
        report: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBudgetUtilizationChart = () => {
    if (!dashboardData || !dashboardData.allocations || dashboardData.allocations.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data Available',
          data: [0],
          backgroundColor: 'rgba(200, 200, 200, 0.8)',
          borderColor: 'rgba(200, 200, 200, 1)',
          borderWidth: 1,
        }]
      };
    }

    const allocations = dashboardData.allocations;
    const labels = allocations.map(allocation => allocation.budgetHeadName);
    const allocatedData = allocations.map(allocation => allocation.allocatedAmount);
    const spentData = allocations.map(allocation => allocation.spentAmount);
    const remainingData = allocations.map(allocation => allocation.remainingAmount);

    return {
      labels,
      datasets: [
        {
          label: 'Allocated',
          data: allocatedData,
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 1,
        },
        {
          label: 'Spent',
          data: spentData,
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1,
        },
        {
          label: 'Remaining',
          data: remainingData,
          backgroundColor: 'rgba(255, 193, 7, 0.8)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getDepartmentComparisonChart = () => {
    if (!dashboardData || user.role === 'department' || !dashboardData.allocations || dashboardData.allocations.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data Available',
          data: [0],
          backgroundColor: 'rgba(200, 200, 200, 0.8)',
          borderColor: 'rgba(200, 200, 200, 1)',
          borderWidth: 1,
        }]
      };
    }

    const departments = [...new Set(dashboardData.allocations.map(a => a.departmentName))];
    const departmentData = departments.map(dept => {
      const deptAllocations = dashboardData.allocations.filter(a => a.departmentName === dept);
      const totalAllocated = deptAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
      const totalSpent = deptAllocations.reduce((sum, a) => sum + a.spentAmount, 0);
      return {
        department: dept,
        allocated: totalAllocated,
        spent: totalSpent,
        utilization: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0
      };
    });

    return {
      labels: departments,
      datasets: [
        {
          label: 'Budget Utilization %',
          data: departmentData.map(d => d.utilization),
          backgroundColor: departmentData.map(d => 
            d.utilization > 90 ? 'rgba(220, 53, 69, 0.8)' :
            d.utilization > 75 ? 'rgba(255, 193, 7, 0.8)' :
            d.utilization > 50 ? 'rgba(23, 162, 184, 0.8)' :
            'rgba(40, 167, 69, 0.8)'
          ),
          borderColor: departmentData.map(d => 
            d.utilization > 90 ? 'rgba(220, 53, 69, 1)' :
            d.utilization > 75 ? 'rgba(255, 193, 7, 1)' :
            d.utilization > 50 ? 'rgba(23, 162, 184, 1)' :
            'rgba(40, 167, 69, 1)'
          ),
          borderWidth: 1,
        },
      ],
    };
  };

  const getExpenditureTrendChart = () => {
    if (!dashboardData || !dashboardData.expenditures || dashboardData.expenditures.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data Available',
          data: [0],
          borderColor: 'rgba(200, 200, 200, 1)',
          backgroundColor: 'rgba(200, 200, 200, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        }]
      };
    }

    // Group expenditures by month
    const monthlyData = {};
    dashboardData.expenditures.forEach(exp => {
      const month = new Date(exp.billDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month] += exp.billAmount;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB;
    });

    return {
      labels: sortedMonths,
      datasets: [
        {
          label: 'Monthly Expenditure',
          data: sortedMonths.map(month => monthlyData[month]),
          borderColor: 'rgba(102, 126, 234, 1)',
          backgroundColor: 'rgba(102, 126, 234, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getBudgetHeadDistributionChart = () => {
    if (!dashboardData || !dashboardData.allocations || dashboardData.allocations.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [100],
          backgroundColor: ['rgba(200, 200, 200, 0.8)'],
          borderColor: ['rgba(200, 200, 200, 1)'],
          borderWidth: 2,
        }]
      };
    }

    const budgetHeads = [...new Set(dashboardData.allocations.map(a => a.budgetHeadName))];
    const budgetHeadData = budgetHeads.map(head => {
      const headAllocations = dashboardData.allocations.filter(a => a.budgetHeadName === head);
      return {
        head,
        amount: headAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
      };
    });

    const colors = [
      'rgba(102, 126, 234, 0.8)',
      'rgba(40, 167, 69, 0.8)',
      'rgba(255, 193, 7, 0.8)',
      'rgba(220, 53, 69, 0.8)',
      'rgba(23, 162, 184, 0.8)',
      'rgba(111, 66, 193, 0.8)',
    ];

    return {
      labels: budgetHeadData.map(d => d.head),
      datasets: [
        {
          data: budgetHeadData.map(d => d.amount),
          backgroundColor: colors.slice(0, budgetHeadData.length),
          borderColor: colors.slice(0, budgetHeadData.length).map(c => c.replace('0.8', '1')),
          borderWidth: 2,
        },
      ],
    };
  };

  const getChartOptions = (type) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y || context.parsed)}`;
            }
          }
        }
      },
    };

    if (type === 'line') {
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value);
              }
            }
          }
        }
      };
    }

    if (type === 'bar') {
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value);
              }
            }
          }
        }
      };
    }

    return baseOptions;
  };

  const getDashboardTitle = () => {
    switch (user.role) {
      case 'department':
        return 'Department Budget Dashboard';
      case 'hod':
        return 'HOD Management Dashboard';
      case 'office':
        return 'Office Financial Dashboard';
      case 'vice_principal':
      case 'principal':
        return 'Management Overview Dashboard';
      case 'admin':
        return 'System Administration Dashboard';
      default:
        return 'Budget Management Dashboard';
    }
  };

  const getKeyMetrics = () => {
    if (!dashboardData || !dashboardData.allocations || !dashboardData.expenditures) {
      return [
        {
          title: 'Total Budget',
          value: '₹0',
          icon: 'fas fa-wallet',
          color: '#667eea',
          change: '0%'
        },
        {
          title: 'Total Spent',
          value: '₹0',
          icon: 'fas fa-chart-line',
          color: '#28a745',
          change: '0%'
        },
        {
          title: 'Remaining Budget',
          value: '₹0',
          icon: 'fas fa-piggy-bank',
          color: '#ffc107',
          change: '0%'
        },
        {
          title: 'Utilization Rate',
          value: '0%',
          icon: 'fas fa-percentage',
          color: '#17a2b8',
          change: '0%'
        }
      ];
    }

    const allocations = dashboardData.allocations;
    const expenditures = dashboardData.expenditures;

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const totalSpent = expenditures.reduce((sum, e) => sum + e.billAmount, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const utilizationPercentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    return [
      {
        title: 'Total Budget',
        value: formatCurrency(totalAllocated),
        icon: 'fas fa-wallet',
        color: '#667eea',
        change: '+12.5%'
      },
      {
        title: 'Total Spent',
        value: formatCurrency(totalSpent),
        icon: 'fas fa-chart-line',
        color: '#28a745',
        change: '+8.2%'
      },
      {
        title: 'Remaining Budget',
        value: formatCurrency(totalRemaining),
        icon: 'fas fa-piggy-bank',
        color: '#ffc107',
        change: '-5.3%'
      },
      {
        title: 'Utilization Rate',
        value: `${utilizationPercentage.toFixed(1)}%`,
        icon: 'fas fa-percentage',
        color: utilizationPercentage > 90 ? '#dc3545' : utilizationPercentage > 75 ? '#ffc107' : '#17a2b8',
        change: '+2.1%'
      }
    ];
  };

  if (loading) {
    return (
      <div className="graphical-dashboard-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="graphical-dashboard-container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>{getDashboardTitle()}</h1>
            <p>Real-time budget analytics and insights</p>
          </div>
          <div className="header-controls">
            <div className="time-range-selector">
              <label>Time Range:</label>
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                <option value="current">Current Year (2024-25)</option>
                <option value="previous">Previous Year (2023-24)</option>
              </select>
            </div>
            <button className="refresh-btn" onClick={fetchDashboardData}>
              <i className="fas fa-sync-alt"></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          {getKeyMetrics().map((metric, index) => (
            <div key={index} className="metric-card">
              <div className="metric-icon" style={{ backgroundColor: metric.color }}>
                <i className={metric.icon}></i>
              </div>
              <div className="metric-content">
                <h3>{metric.value}</h3>
                <p>{metric.title}</p>
                <span className="metric-change">{metric.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Budget Utilization Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Budget Utilization by Head</h3>
              <p>Allocated vs Spent vs Remaining</p>
            </div>
            <div className="chart-container">
              <Bar data={getBudgetUtilizationChart()} options={getChartOptions('bar')} />
            </div>
          </div>

          {/* Budget Head Distribution */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Budget Distribution</h3>
              <p>Allocation by Budget Head</p>
            </div>
            <div className="chart-container">
              <Doughnut data={getBudgetHeadDistributionChart()} options={getChartOptions('doughnut')} />
            </div>
          </div>

          {/* Department Comparison (for Office/Management) */}
          {user.role !== 'department' && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>Department Utilization</h3>
                <p>Budget utilization across departments</p>
              </div>
              <div className="chart-container">
                <Bar data={getDepartmentComparisonChart()} options={getChartOptions('bar')} />
              </div>
            </div>
          )}

          {/* Expenditure Trend */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Expenditure Trend</h3>
              <p>Monthly expenditure pattern</p>
            </div>
            <div className="chart-container">
              <Line data={getExpenditureTrendChart()} options={getChartOptions('line')} />
            </div>
          </div>
        </div>

        {/* Real-time Status */}
        <div className="status-section">
          <div className="status-indicator">
            <div className="status-dot live"></div>
            <span>Live Data</span>
          </div>
          <div className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default GraphicalDashboard;
