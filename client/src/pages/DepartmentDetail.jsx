import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { departmentsAPI } from '../services/api';
import { getCurrentFinancialYear, getPreviousFinancialYear } from '../utils/dateUtils';
import { ArrowLeft, Building2, TrendingUp, TrendingDown, Calendar, AlertCircle, FileText, IndianRupee } from 'lucide-react';
import './DepartmentDetail.css';

const DepartmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [departmentData, setDepartmentData] = useState(null);
    const currentFY = getCurrentFinancialYear();
    const previousFY = getPreviousFinancialYear();
    
    // Simple logic to get a year before previous
    const getFYMinus2 = () => {
        const [start] = previousFY.split('-');
        const year = parseInt(start) - 1;
        return `${year}-${year + 1}`;
    };
    const fyMinus2 = getFYMinus2();

    const [selectedFinancialYear, setSelectedFinancialYear] = useState(currentFY);

    useEffect(() => {
        fetchDepartmentData();
    }, [id, selectedFinancialYear]);

    const fetchDepartmentData = async () => {
        try {
            setLoading(true);
            const response = await departmentsAPI.getDepartmentDetail(id, { financialYear: selectedFinancialYear });
            setDepartmentData(response.data.data);
        } catch (error) {
            console.error('Error fetching department detail:', error);
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

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'approved':
                return 'status-approved';
            case 'verified':
                return 'status-verified';
            case 'pending':
                return 'status-pending';
            case 'rejected':
                return 'status-rejected';
            default:
                return '';
        }
    };

    const getBudgetHeadBreakdownChart = () => {
        if (!departmentData || !departmentData.budgetHeadBreakdown) return null;

        const data = Object.entries(departmentData.budgetHeadBreakdown).map(([name, values]) => ({
            name,
            allocated: values.allocated,
            spent: values.spent,
            utilization: values.utilization
        }));

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params) => {
                    return params.map(param =>
                        `${param.seriesName}: ${param.seriesName.includes('Utilization') ? param.value.toFixed(2) + '%' : formatCurrency(param.value)}`
                    ).join('<br/>');
                }
            },
            legend: {
                data: ['Allocated', 'Spent', 'Utilization %']
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.map(d => d.name)
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Amount (₹)',
                    axisLabel: {
                        formatter: (value) => `₹${(value / 1000).toFixed(0)}K`
                    }
                },
                {
                    type: 'value',
                    name: 'Utilization (%)',
                    max: 100,
                    axisLabel: {
                        formatter: '{value}%'
                    }
                }
            ],
            series: [
                {
                    name: 'Allocated',
                    type: 'bar',
                    data: data.map(d => d.allocated),
                    itemStyle: { color: '#667eea' }
                },
                {
                    name: 'Spent',
                    type: 'bar',
                    data: data.map(d => d.spent),
                    itemStyle: { color: '#28a745' }
                },
                {
                    name: 'Utilization %',
                    type: 'line',
                    yAxisIndex: 1,
                    data: data.map(d => d.utilization),
                    itemStyle: { color: '#ffc107' },
                    lineStyle: { width: 3 }
                }
            ]
        };
    };

    if (loading) {
        return (
            <div className="department-detail-container">
                <div className="loading">
                    <p>Loading department details...</p>
                </div>
            </div>
        );
    }

    if (!departmentData) {
        return (
            <div className="department-detail-container">
                <div className="error-message">
                    <AlertCircle size={48} />
                    <h2>Department Not Found</h2>
                    <button onClick={() => navigate(-1)} className="btn-primary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="department-detail-container">
            {/* Header */}
            <div className="detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                    Back
                </button>
                <div className="header-content">
                    <div className="header-left">
                        <div className="dept-icon">
                            <Building2 size={32} />
                        </div>
                        <div className="header-info">
                            <h1>{departmentData.department.name}</h1>
                            <p className="dept-code">Code: {departmentData.department.code}</p>
                            {departmentData.department.description && (
                                <p className="dept-description">{departmentData.department.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="financial-year-selector">
                            <Calendar size={16} />
                            <select value={selectedFinancialYear} onChange={(e) => setSelectedFinancialYear(e.target.value)}>
                                <option value={currentFY}>FY {currentFY}</option>
                                <option value={previousFY}>FY {previousFY}</option>
                                <option value={fyMinus2}>FY {fyMinus2}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="card-icon" style={{ background: '#667eea' }}>
                        <IndianRupee size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{formatCurrency(departmentData.summary.totalAllocated)}</h3>
                        <p>Total Allocated</p>
                        <span className="card-meta">{departmentData.summary.allocationCount} allocations</span>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-icon" style={{ background: '#28a745' }}>
                        <FileText size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{formatCurrency(departmentData.summary.totalSpent)}</h3>
                        <p>Total Spent</p>
                        <span className="card-meta">{departmentData.summary.expenditureCount} expenditures</span>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-icon" style={{ background: '#ffc107' }}>
                        <IndianRupee size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{formatCurrency(departmentData.summary.totalRemaining)}</h3>
                        <p>Remaining Budget</p>
                        <span className={`card-meta ${departmentData.summary.totalRemaining < 0 ? 'negative' : ''}`}>
                            {departmentData.summary.totalRemaining < 0 ? 'Overspent' : 'Available'}
                        </span>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-icon" style={{
                        background: departmentData.summary.utilizationPercentage > 90 ? '#dc3545' :
                            departmentData.summary.utilizationPercentage > 75 ? '#ffc107' : '#17a2b8'
                    }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{departmentData.summary.utilizationPercentage.toFixed(2)}%</h3>
                        <p>Utilization Rate</p>
                        <span className="card-meta">Budget efficiency</span>
                    </div>
                </div>
            </div>

            {/* Year Comparison */}
            {departmentData.yearComparison ? (
                <div className="year-comparison-section">
                    <h2>Year-over-Year Comparison</h2>
                    <div className="comparison-grid">
                        <div className="comparison-card">
                            <h4>Budget Allocated</h4>
                            <div className="comparison-values">
                                <div className="value-row">
                                    <span>Previous ({departmentData.yearComparison.previousYear}):</span>
                                    <span>{formatCurrency(departmentData.yearComparison.previous.totalAllocated)}</span>
                                </div>
                                <div className="value-row">
                                    <span>Current ({departmentData.yearComparison.currentYear}):</span>
                                    <span>{formatCurrency(departmentData.yearComparison.current.totalAllocated)}</span>
                                </div>
                            </div>
                            <div className="change-badge">
                                {departmentData.yearComparison.changes.allocatedChange >= 0 ? (
                                    <span className="positive">
                                        <TrendingUp size={16} />
                                        +{departmentData.yearComparison.changes.allocatedChange.toFixed(2)}%
                                    </span>
                                ) : (
                                    <span className="negative">
                                        <TrendingDown size={16} />
                                        {departmentData.yearComparison.changes.allocatedChange.toFixed(2)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="comparison-card">
                            <h4>Expenses Incurred</h4>
                            <div className="comparison-values">
                                <div className="value-row">
                                    <span>Previous ({departmentData.yearComparison.previousYear}):</span>
                                    <span>{formatCurrency(departmentData.yearComparison.previous.totalSpent)}</span>
                                </div>
                                <div className="value-row">
                                    <span>Current ({departmentData.yearComparison.currentYear}):</span>
                                    <span>{formatCurrency(departmentData.yearComparison.current.totalSpent)}</span>
                                </div>
                            </div>
                            <div className="change-badge">
                                {departmentData.yearComparison.changes.spentChange >= 0 ? (
                                    <span className="warning">
                                        <TrendingUp size={16} />
                                        +{departmentData.yearComparison.changes.spentChange.toFixed(2)}%
                                    </span>
                                ) : (
                                    <span className="positive">
                                        <TrendingDown size={16} />
                                        {departmentData.yearComparison.changes.spentChange.toFixed(2)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="comparison-card">
                            <h4>Utilization Rate</h4>
                            <div className="comparison-values">
                                <div className="value-row">
                                    <span>Previous ({departmentData.yearComparison.previousYear}):</span>
                                    <span>{departmentData.yearComparison.previous.utilization.toFixed(2)}%</span>
                                </div>
                                <div className="value-row">
                                    <span>Current ({departmentData.yearComparison.currentYear}):</span>
                                    <span>{departmentData.yearComparison.current.utilization.toFixed(2)}%</span>
                                </div>
                            </div>
                            <div className="change-badge">
                                <span className="neutral">
                                    {departmentData.yearComparison.changes.utilizationChange >= 0 ? '+' : ''}
                                    {departmentData.yearComparison.changes.utilizationChange.toFixed(2)}% points
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="year-comparison-section">
                    <h2>Year-over-Year Comparison</h2>
                    <div className="no-data-message">
                        <AlertCircle size={48} />
                        <p>No previous year data available for comparison</p>
                    </div>
                </div>
            )}

            {/* Budget Head Breakdown Chart */}
            {getBudgetHeadBreakdownChart() && (
                <div className="chart-section">
                    <h2>Budget Head-wise Allocation & Utilization</h2>
                    <div className="chart-container">
                        <ReactECharts option={getBudgetHeadBreakdownChart()} style={{ height: '400px', width: '100%' }} />
                    </div>
                </div>
            )}

            {/* Budget Head Breakdown Table */}
            <div className="table-section">
                <h2>Budget Head Breakdown</h2>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Budget Head</th>
                                <th>Code</th>
                                <th>Allocated</th>
                                <th>Spent</th>
                                <th>Remaining</th>
                                <th>Utilization</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(departmentData.budgetHeadBreakdown).map(([name, data]) => (
                                <tr key={name}>
                                    <td><strong>{name}</strong></td>
                                    <td>{data.budgetHeadCode}</td>
                                    <td>{formatCurrency(data.allocated)}</td>
                                    <td>{formatCurrency(data.spent)}</td>
                                    <td className={data.remaining < 0 ? 'negative' : ''}>{formatCurrency(data.remaining)}</td>
                                    <td>
                                        <div className="utilization-cell">
                                            <span>{data.utilization.toFixed(2)}%</span>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{
                                                        width: `${Math.min(data.utilization, 100)}%`,
                                                        backgroundColor: data.utilization > 90 ? '#dc3545' :
                                                            data.utilization > 75 ? '#ffc107' : '#28a745'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expenditure Register */}
            <div className="table-section">
                <h2>Expenditure Bill Register</h2>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Bill No</th>
                                <th>Date</th>
                                <th>Budget Head</th>
                                <th>Amount</th>
                                <th>Purpose</th>
                                <th>Submitted By</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departmentData.expenditures.length > 0 ? (
                                departmentData.expenditures.map((exp) => (
                                    <tr key={exp._id}>
                                        <td><strong>{exp.billNumber}</strong></td>
                                        <td>{formatDate(exp.billDate)}</td>
                                        <td>{exp.budgetHead.name}</td>
                                        <td>{formatCurrency(exp.billAmount)}</td>
                                        <td className="purpose-cell">{exp.purpose}</td>
                                        <td>{exp.submittedBy.name}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadgeClass(exp.status)}`}>
                                                {exp.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="no-data-cell">
                                        <AlertCircle size={24} />
                                        <span>No expenditures found for this financial year</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Status Breakdown */}
            <div className="status-breakdown-section">
                <h2>Expenditure Status Summary</h2>
                <div className="status-grid">
                    <div className="status-card pending">
                        <h3>{departmentData.statusBreakdown.pending}</h3>
                        <p>Pending</p>
                    </div>
                    <div className="status-card verified">
                        <h3>{departmentData.statusBreakdown.verified}</h3>
                        <p>Verified</p>
                    </div>
                    <div className="status-card approved">
                        <h3>{departmentData.statusBreakdown.approved}</h3>
                        <p>Approved</p>
                    </div>
                    <div className="status-card rejected">
                        <h3>{departmentData.statusBreakdown.rejected}</h3>
                        <p>Rejected</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentDetail;
