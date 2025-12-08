import React, { useState, useEffect } from 'react';
import { auditLogAPI } from '../services/api';
import './AuditLogs.css';

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    eventType: '',
    action: '',
    actorRole: '',
    targetType: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0
  });

  useEffect(() => {
    fetchAuditLogs();
    fetchStats();
  }, [filters, pagination.currentPage]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: 20,
        ...filters
      };
      
      const response = await auditLogAPI.getAuditLogs(params);
      setAuditLogs(response.data.data.auditLogs);
      setPagination(response.data.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await auditLogAPI.getAuditLogStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching audit log stats:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...filters
      });
      
      const response = await fetch(`/api/audit-logs/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit-logs.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error exporting audit logs:', err);
    }
  };

  const getEventTypeColor = (eventType) => {
    const colors = {
      'user_login': '#28a745',
      'user_logout': '#6c757d',
      'expenditure_submitted': '#17a2b8',
      'expenditure_approved': '#28a745',
      'expenditure_rejected': '#dc3545',
      'budget_allocation_created': '#007bff',
      'budget_allocation_updated': '#ffc107',
      'user_created': '#6f42c1',
      'user_updated': '#fd7e14',
      'department_created': '#20c997'
    };
    return colors[eventType] || '#6c757d';
  };

  const getActionIcon = (action) => {
    const icons = {
      'login': 'fas fa-sign-in-alt',
      'logout': 'fas fa-sign-out-alt',
      'create': 'fas fa-plus',
      'update': 'fas fa-edit',
      'delete': 'fas fa-trash',
      'approve': 'fas fa-check',
      'reject': 'fas fa-times',
      'submit': 'fas fa-paper-plane',
      'view': 'fas fa-eye'
    };
    return icons[action] || 'fas fa-circle';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="audit-logs-container">
        <div className="loading">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className="audit-logs-container">
      <div className="audit-logs-header">
        <h1>Audit Logs</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleExport}>
            <i className="fas fa-download"></i>
            Export CSV
          </button>
        </div>
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
              <i className="fas fa-list"></i>
            </div>
            <div className="stat-info">
              <div className="stat-number">{stats.totalLogs}</div>
              <div className="stat-label">Total Logs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info">
              <div className="stat-number">{Object.keys(stats.logsByActorRole).length}</div>
              <div className="stat-label">Active Roles</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-info">
              <div className="stat-number">{Object.keys(stats.logsByEventType).length}</div>
              <div className="stat-label">Event Types</div>
            </div>
          </div>
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search logs..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <select
            name="eventType"
            value={filters.eventType}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Event Types</option>
            <option value="user_login">User Login</option>
            <option value="expenditure_submitted">Expenditure Submitted</option>
            <option value="expenditure_approved">Expenditure Approved</option>
            <option value="expenditure_rejected">Expenditure Rejected</option>
            <option value="budget_allocation_created">Budget Allocation Created</option>
            <option value="user_created">User Created</option>
          </select>
        </div>
        <div className="filter-group">
          <select
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="submit">Submit</option>
          </select>
        </div>
        <div className="filter-group">
          <select
            name="actorRole"
            value={filters.actorRole}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="office">Office</option>
            <option value="department">Department</option>
            <option value="hod">HOD</option>
            <option value="vice_principal">Vice Principal</option>
            <option value="principal">Principal</option>
          </select>
        </div>
        <div className="filter-group">
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="filter-input"
            placeholder="Start Date"
          />
        </div>
        <div className="filter-group">
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="filter-input"
            placeholder="End Date"
          />
        </div>
      </div>

      <div className="audit-logs-table">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event Type</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log._id}>
                <td className="timestamp">
                  {formatDate(log.createdAt)}
                </td>
                <td className="event-type">
                  <span 
                    className="event-badge"
                    style={{ backgroundColor: getEventTypeColor(log.eventType) }}
                  >
                    {log.eventType.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="actor">
                  <div className="actor-info">
                    <span className="actor-name">{log.actorName}</span>
                    <span className="actor-role">{log.actorRole}</span>
                  </div>
                </td>
                <td className="action">
                  <i className={getActionIcon(log.action)}></i>
                  {log.action}
                </td>
                <td className="target">
                  {log.targetName && (
                    <div className="target-info">
                      <span className="target-name">{log.targetName}</span>
                      <span className="target-type">{log.targetType}</span>
                    </div>
                  )}
                </td>
                <td className="details">
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="details-summary">
                      {Object.entries(log.details).slice(0, 2).map(([key, value]) => (
                        <div key={key} className="detail-item">
                          <span className="detail-key">{key}:</span>
                          <span className="detail-value">{String(value)}</span>
                        </div>
                      ))}
                      {Object.keys(log.details).length > 2 && (
                        <span className="more-details">+{Object.keys(log.details).length - 2} more</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {auditLogs.length === 0 && (
        <div className="no-logs">
          <div className="no-logs-icon">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <h3>No Audit Logs Found</h3>
          <p>No audit logs found matching the current filters.</p>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-secondary"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            <i className="fas fa-chevron-left"></i>
            Previous
          </button>
          
          <span className="page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button 
            className="btn btn-secondary"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
