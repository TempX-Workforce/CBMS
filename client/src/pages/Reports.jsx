import React, { useState, useEffect } from 'react';
import { reportAPI, departmentsAPI, budgetHeadsAPI, usersAPI } from '../services/api';
import { Receipt, IndianRupee, PieChart, ClipboardList, Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './Reports.css';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('expenditures');
  const [filters, setFilters] = useState({
    format: 'json',
    startDate: '',
    endDate: '',
    departmentId: '',
    budgetHeadId: '',
    status: '',
    submittedBy: '',
    financialYear: ''
  });
  const [departments, setDepartments] = useState([]);
  const [budgetHeads, setBudgetHeads] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [departmentsRes, budgetHeadsRes, usersRes] = await Promise.all([
        departmentsAPI.getDepartments(),
        budgetHeadsAPI.getBudgetHeads(),
        usersAPI.getUsers({ limit: 1000 })
      ]);

      setDepartments(departmentsRes.data.data.departments);
      setBudgetHeads(budgetHeadsRes.data.data.budgetHeads);
      setUsers(usersRes.data.data.users);
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReportTypeChange = (type) => {
    setReportType(type);
    setReportData(null);
    setError(null);
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { ...filters };

      let response;
      switch (reportType) {
        case 'expenditures':
          response = await reportAPI.getExpenditureReport(params);
          break;
        case 'allocations':
          response = await reportAPI.getAllocationReport(params);
          break;
        case 'dashboard':
          response = await reportAPI.getDashboardReport(params);
          break;
        case 'audit':
          response = await reportAPI.getAuditReport(params);
          break;
        default:
          throw new Error('Invalid report type');
      }

      if (filters.format === 'csv') {
        // Handle CSV download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (filters.format === 'excel') {
        handleExcelExport(response.data.data);
      } else if (filters.format === 'pdf') {
        handlePDFExport(response.data.data);
      } else {
        setReportData(response.data.data);
      }
    } catch (err) {
      setError('Failed to generate report');
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = (data) => {
    let exportData = [];
    let fileName = `${reportType}-report.xlsx`;

    if (reportType === 'expenditures') {
      exportData = data.expenditures.map(exp => ({
        'Bill Number': exp.billNumber,
        'Bill Date': formatDate(exp.billDate),
        'Amount': exp.billAmount,
        'Party Name': exp.partyName,
        'Department': exp.department.name,
        'Budget Head': exp.budgetHead.name,
        'Status': exp.status,
        'Details': exp.expenseDetails
      }));
    } else if (reportType === 'allocations') {
      exportData = data.allocations.map(alloc => ({
        'Financial Year': alloc.financialYear,
        'Department': alloc.department.name,
        'Budget Head': alloc.budgetHead.name,
        'Allocated Amount': alloc.allocatedAmount,
        'Spent Amount': alloc.spentAmount,
        'Remaining Amount': alloc.remainingAmount,
        'Utilization %': Math.round((alloc.spentAmount / alloc.allocatedAmount) * 100)
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, fileName);
  };

  const handlePDFExport = (data) => {
    const doc = new jsPDF();
    const fileName = `${reportType}-report.pdf`;

    doc.setFontSize(18);
    doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    let columns = [];
    let rows = [];

    if (reportType === 'expenditures') {
      columns = ['Bill #', 'Date', 'Amount', 'Party', 'Dept', 'Status'];
      rows = data.expenditures.map(exp => [
        exp.billNumber,
        formatDate(exp.billDate),
        formatCurrency(exp.billAmount),
        exp.partyName,
        exp.department.name,
        exp.status
      ]);
    } else if (reportType === 'allocations') {
      columns = ['FY', 'Dept', 'Budget Head', 'Allocated', 'Spent', 'Remaining'];
      rows = data.allocations.map(alloc => [
        alloc.financialYear,
        alloc.department.name,
        alloc.budgetHead.name,
        formatCurrency(alloc.allocatedAmount),
        formatCurrency(alloc.spentAmount),
        formatCurrency(alloc.remainingAmount)
      ]);
    }

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(fileName);
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

  const renderExpenditureReport = () => {
    if (!reportData) return null;

    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Expenditures:</span>
              <span className="value">{reportData.summary.totalExpenditures}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Amount:</span>
              <span className="value">{formatCurrency(reportData.summary.totalAmount)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Approved Amount:</span>
              <span className="value approved">{formatCurrency(reportData.summary.approvedAmount)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Pending Amount:</span>
              <span className="value pending">{formatCurrency(reportData.summary.pendingAmount)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Rejected Amount:</span>
              <span className="value rejected">{formatCurrency(reportData.summary.rejectedAmount)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Average Amount:</span>
              <span className="value">{formatCurrency(reportData.summary.averageAmount)}</span>
            </div>
          </div>
        </div>

        <div className="report-breakdown">
          <h3>Department Breakdown</h3>
          <div className="breakdown-table table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Count</th>
                  <th>Total Amount</th>
                  <th>Approved</th>
                  <th>Pending</th>
                  <th>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {reportData.departmentBreakdown.map((dept, index) => (
                  <tr key={index}>
                    <td data-label="Department">{dept.departmentName}</td>
                    <td data-label="Count">{dept.count}</td>
                    <td data-label="Total Amount">{formatCurrency(dept.totalAmount)}</td>
                    <td className="approved" data-label="Approved">{formatCurrency(dept.approvedAmount)}</td>
                    <td className="pending" data-label="Pending">{formatCurrency(dept.pendingAmount)}</td>
                    <td className="rejected" data-label="Rejected">{formatCurrency(dept.rejectedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="report-breakdown">
          <h3>Budget Head Breakdown</h3>
          <div className="breakdown-table table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Budget Head</th>
                  <th>Count</th>
                  <th>Total Amount</th>
                  <th>Approved</th>
                  <th>Pending</th>
                  <th>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {reportData.budgetHeadBreakdown.map((head, index) => (
                  <tr key={index}>
                    <td data-label="Budget Head">{head.budgetHeadName} ({head.budgetHeadCode})</td>
                    <td data-label="Count">{head.count}</td>
                    <td data-label="Total Amount">{formatCurrency(head.totalAmount)}</td>
                    <td className="approved" data-label="Approved">{formatCurrency(head.approvedAmount)}</td>
                    <td className="pending" data-label="Pending">{formatCurrency(head.pendingAmount)}</td>
                    <td className="rejected" data-label="Rejected">{formatCurrency(head.rejectedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAllocationReport = () => {
    if (!reportData) return null;

    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Allocations:</span>
              <span className="value">{reportData.summary.totalAllocations}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Allocated:</span>
              <span className="value">{formatCurrency(reportData.summary.totalAllocatedAmount)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Spent:</span>
              <span className="value">{formatCurrency(reportData.summary.totalSpentAmount)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Remaining:</span>
              <span className="value">{formatCurrency(reportData.summary.totalRemainingAmount)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Utilization:</span>
              <span className="value">{reportData.summary.utilizationPercentage}%</span>
            </div>
            <div className="summary-item">
              <span className="label">Average Allocation:</span>
              <span className="value">{formatCurrency(reportData.summary.averageAllocation)}</span>
            </div>
          </div>
        </div>

        <div className="report-breakdown">
          <h3>Department Breakdown</h3>
          <div className="breakdown-table table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Allocations</th>
                  <th>Total Allocated</th>
                  <th>Total Spent</th>
                  <th>Remaining</th>
                  <th>Utilization %</th>
                </tr>
              </thead>
              <tbody>
                {reportData.departmentBreakdown.map((dept, index) => (
                  <tr key={index}>
                    <td data-label="Department">{dept.departmentName}</td>
                    <td data-label="Allocations">{dept.count}</td>
                    <td data-label="Total Allocated">{formatCurrency(dept.totalAllocated)}</td>
                    <td data-label="Total Spent">{formatCurrency(dept.totalSpent)}</td>
                    <td data-label="Remaining">{formatCurrency(dept.totalRemaining)}</td>
                    <td data-label="Utilization %">{Math.round((dept.totalSpent / dept.totalAllocated) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboardReport = () => {
    if (!reportData) return null;

    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Overall Statistics</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Departments:</span>
              <span className="value">{reportData.overallStats.totalDepartments}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Budget Heads:</span>
              <span className="value">{reportData.overallStats.totalBudgetHeads}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Allocated:</span>
              <span className="value">{formatCurrency(reportData.overallStats.totalAllocatedAmount)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Spent:</span>
              <span className="value">{formatCurrency(reportData.overallStats.totalSpentAmount)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Remaining:</span>
              <span className="value">{formatCurrency(reportData.overallStats.totalRemainingAmount)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Overall Utilization:</span>
              <span className="value">{reportData.overallStats.utilizationPercentage}%</span>
            </div>
          </div>
        </div>

        <div className="report-breakdown">
          <h3>Department Performance</h3>
          <div className="breakdown-table table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Allocated</th>
                  <th>Spent</th>
                  <th>Remaining</th>
                  <th>Utilization %</th>
                  <th>Expenditures</th>
                </tr>
              </thead>
              <tbody>
                {reportData.departmentPerformance.map((dept, index) => (
                  <tr key={index}>
                    <td data-label="Department">{dept.departmentName}</td>
                    <td data-label="Allocated">{formatCurrency(dept.totalAllocated)}</td>
                    <td data-label="Spent">{formatCurrency(dept.totalSpent)}</td>
                    <td data-label="Remaining">{formatCurrency(dept.totalRemaining)}</td>
                    <td data-label="Utilization %">{dept.utilizationPercentage}%</td>
                    <td data-label="Expenditures">{dept.expenditureCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="report-breakdown">
          <h3>Recent Activities</h3>
          <div className="activities-list">
            {reportData.recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <i className={`fas fa-${activity.type === 'expenditure_submitted' ? 'paper-plane' : 'check-circle'}`}></i>
                </div>
                <div className="activity-content">
                  <div className="activity-description">{activity.description}</div>
                  <div className="activity-meta">
                    <span className="activity-amount">{formatCurrency(activity.amount)}</span>
                    <span className="activity-date">{formatDate(activity.date)}</span>
                    <span className={`activity-status ${activity.status}`}>{activity.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Reports & Analytics</h1>
        <p>Generate comprehensive reports for budget allocations and expenditures</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="reports-controls">
        <div className="report-type-selector">
          <h3>Report Type</h3>
          <div className="type-buttons">
            <button
              className={`type-btn ${reportType === 'expenditures' ? 'active' : ''}`}
              onClick={() => handleReportTypeChange('expenditures')}
            >
              <Receipt size={24} />
              Expenditure Report
            </button>
            <button
              className={`type-btn ${reportType === 'allocations' ? 'active' : ''}`}
              onClick={() => handleReportTypeChange('allocations')}
            >
              <IndianRupee size={24} />
              Allocation Report
            </button>
            <button
              className={`type-btn ${reportType === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleReportTypeChange('dashboard')}
            >
              <PieChart size={24} />
              Dashboard Report
            </button>
            <button
              className={`type-btn ${reportType === 'audit' ? 'active' : ''}`}
              onClick={() => handleReportTypeChange('audit')}
            >
              <ClipboardList size={24} />
              Audit Report
            </button>
          </div>
        </div>

        <div className="report-filters">
          <h3>Filters</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="format">Format</label>
              <select
                id="format"
                name="format"
                value={filters.format}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="json">JSON (View)</option>
                <option value="csv">CSV (Download)</option>
                <option value="excel">Excel (Download)</option>
                <option value="pdf">PDF (Download)</option>
              </select>
            </div>

            {reportType === 'expenditures' && (
              <>
                <div className="filter-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </>
            )}

            <div className="filter-group">
              <label htmlFor="departmentId">Department</label>
              <select
                id="departmentId"
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
              <label htmlFor="budgetHeadId">Budget Head</label>
              <select
                id="budgetHeadId"
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
              <label htmlFor="financialYear">Financial Year</label>
              <select
                id="financialYear"
                name="financialYear"
                value={filters.financialYear}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
              </select>
            </div>
          </div>
        </div>

        <div className="report-actions">
          <button
            className="btn btn-primary"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? (
              'Generating...'
            ) : (
              <>
                <Download size={16} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {reportData && filters.format === 'json' && (
        <div className="report-results">
          {reportType === 'expenditures' && renderExpenditureReport()}
          {reportType === 'allocations' && renderAllocationReport()}
          {reportType === 'dashboard' && renderDashboardReport()}
          {reportType === 'audit' && (
            <div className="report-content">
              <div className="report-summary">
                <h3>Audit Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Total Logs:</span>
                    <span className="value">{reportData.summary.totalLogs}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Event Types:</span>
                    <span className="value">{Object.keys(reportData.summary.logsByEventType).length}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Actor Roles:</span>
                    <span className="value">{Object.keys(reportData.summary.logsByActorRole).length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;