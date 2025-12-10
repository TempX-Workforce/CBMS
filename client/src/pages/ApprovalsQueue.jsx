import React, { useState, useEffect } from 'react';
import { expenditureAPI } from '../services/api';
import { Paperclip, Check, X, ClipboardCheck } from 'lucide-react';
import './ApprovalsQueue.css';

const ApprovalsQueue = () => {
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExpenditure, setSelectedExpenditure] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    departmentId: '',
    budgetHeadId: '',
    status: 'pending'
  });

  useEffect(() => {
    fetchExpenditures();
  }, [filters]);

  const fetchExpenditures = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.budgetHeadId) params.budgetHeadId = filters.budgetHeadId;
      if (filters.status) params.status = filters.status;

      const response = await expenditureAPI.getExpenditures(params);
      setExpenditures(response.data.data.expenditures);
      setError(null);
    } catch (err) {
      setError('Failed to fetch expenditures');
      console.error('Error fetching expenditures:', err);
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

  const handleApprove = (expenditure) => {
    setSelectedExpenditure(expenditure);
    setActionType('approve');
    setRemarks('');
    setShowModal(true);
  };

  const handleReject = (expenditure) => {
    setSelectedExpenditure(expenditure);
    setActionType('reject');
    setRemarks('');
    setShowModal(true);
  };

  const handleProcessAction = async () => {
    if (!selectedExpenditure) return;

    if (actionType === 'reject' && !remarks.trim()) {
      setError('Remarks are required for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      if (actionType === 'approve') {
        await expenditureAPI.approveExpenditure(selectedExpenditure._id, { remarks });
      } else {
        await expenditureAPI.rejectExpenditure(selectedExpenditure._id, { remarks });
      }

      setShowModal(false);
      setSelectedExpenditure(null);
      setRemarks('');
      fetchExpenditures();
    } catch (err) {
      setError(`Failed to ${actionType} expenditure`);
      console.error(`Error ${actionType}ing expenditure:`, err);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedExpenditure(null);
    setRemarks('');
    setError(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      approved: '#28a745',
      rejected: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'fas fa-clock',
      approved: 'fas fa-check-circle',
      rejected: 'fas fa-times-circle'
    };
    return icons[status] || 'fas fa-question-circle';
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
      <div className="approvals-queue-container">
        <div className="loading">Loading approval queue...</div>
      </div>
    );
  }

  return (
    <div className="approvals-queue-container">
      <div className="approvals-header">
        <h1>Approvals Queue</h1>
        <div className="queue-stats">
          <div className="stat-item">
            <span className="stat-number">{expenditures.filter(exp => exp.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{expenditures.filter(exp => exp.status === 'approved').length}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{expenditures.filter(exp => exp.status === 'rejected').length}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search expenditures..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <select
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
      </div>

      <div className="expenditures-grid">
        {expenditures.map((expenditure) => (
          <div key={expenditure._id} className="expenditure-card">
            <div className="card-header">
              <div className="expenditure-info">
                <h3 className="bill-number">{expenditure.billNumber}</h3>
                <span className="department-name">{expenditure.departmentName}</span>
              </div>
              <div className="status-badge" style={{ backgroundColor: getStatusColor(expenditure.status) }}>
                <i className={getStatusIcon(expenditure.status)}></i>
                {expenditure.status.charAt(0).toUpperCase() + expenditure.status.slice(1)}
              </div>
            </div>

            <div className="card-body">
              <div className="expenditure-details">
                <div className="detail-row">
                  <span className="label">Budget Head:</span>
                  <span className="value">{expenditure.budgetHeadName} ({expenditure.budgetHeadCode})</span>
                </div>
                <div className="detail-row">
                  <span className="label">Party:</span>
                  <span className="value">{expenditure.partyName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value amount">{formatCurrency(expenditure.billAmount)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Bill Date:</span>
                  <span className="value">{formatDate(expenditure.billDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Submitted:</span>
                  <span className="value">{formatDate(expenditure.submittedAt)}</span>
                </div>
              </div>

              <div className="expense-details">
                <p className="expense-description">{expenditure.expenseDetails}</p>
              </div>

              {expenditure.attachments && expenditure.attachments.length > 0 && (
                <div className="attachments">
                  <span className="attachments-label">Attachments:</span>
                  <div className="attachment-list">
                    {expenditure.attachments.map((attachment, index) => (
                      <div key={index} className="attachment-item">
                        <Paperclip size={14} />
                        <span className="attachment-name">{attachment.originalName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expenditure.remarks && (
                <div className="remarks">
                  <span className="remarks-label">Remarks:</span>
                  <p className="remarks-text">{expenditure.remarks}</p>
                </div>
              )}
            </div>

            <div className="card-actions">
              {expenditure.status === 'pending' && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => handleApprove(expenditure)}
                  >
                    <Check size={16} /> Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleReject(expenditure)}
                  >
                    <X size={16} /> Reject
                  </button>
                </>
              )}
              {expenditure.status !== 'pending' && (
                <div className="approval-history">
                  {expenditure.approvalHistory && expenditure.approvalHistory.length > 0 && (
                    <div className="history-item">
                      <span className="approver">{expenditure.approvalHistory[expenditure.approvalHistory.length - 1].approverName}</span>
                      <span className="decision">{expenditure.approvalHistory[expenditure.approvalHistory.length - 1].decision}</span>
                      <span className="date">{formatDate(expenditure.approvalHistory[expenditure.approvalHistory.length - 1].timestamp)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {expenditures.length === 0 && (
        <div className="no-expenditures">
          <div className="no-expenditures-icon">
            <ClipboardCheck size={48} />
          </div>
          <h3>No Expenditures Found</h3>
          <p>No expenditures found matching the current filters.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{actionType === 'approve' ? 'Approve Expenditure' : 'Reject Expenditure'}</h2>
              <button className="close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {selectedExpenditure && (
                <div className="expenditure-summary">
                  <h3>{selectedExpenditure.billNumber}</h3>
                  <p><strong>Department:</strong> {selectedExpenditure.departmentName}</p>
                  <p><strong>Budget Head:</strong> {selectedExpenditure.budgetHeadName}</p>
                  <p><strong>Party:</strong> {selectedExpenditure.partyName}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedExpenditure.billAmount)}</p>
                  <p><strong>Details:</strong> {selectedExpenditure.expenseDetails}</p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="remarks">
                  {actionType === 'approve' ? 'Approval Remarks (Optional)' : 'Rejection Remarks (Required)'}
                </label>
                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={actionType === 'approve' ? 'Add any remarks...' : 'Please provide reason for rejection...'}
                  rows="4"
                  required={actionType === 'reject'}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleProcessAction}
                disabled={isProcessing || (actionType === 'reject' && !remarks.trim())}
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    <i className={`fas fa-${actionType === 'approve' ? 'check' : 'times'}`}></i>
                    {actionType === 'approve' ? 'Approve' : 'Reject'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsQueue;