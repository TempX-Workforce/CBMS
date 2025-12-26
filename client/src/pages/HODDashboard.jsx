import React, { useState, useEffect } from 'react';
import { expenditureAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { CheckCircle, Paperclip, Check, X } from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import './HODDashboard.css';

const HODDashboard = () => {
  const { user } = useAuth();
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExpenditure, setSelectedExpenditure] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const { socket } = useSocket();
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchExpenditures();
  }, [statusFilter]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      console.log('Real-time HOD update received:', data);
      fetchExpenditures(); // Refresh data on new notification
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, statusFilter]);

  const fetchExpenditures = async () => {
    try {
      setLoading(true);
      const params = {
        departmentId: user.department?._id || user.department,
        status: statusFilter
      };

      // If pending, we specifically want items waiting for HOD
      if (statusFilter === 'pending') {
        params.currentApprover = 'hod';
      }

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

  const handleApprove = (expenditure) => {
    setSelectedExpenditure(expenditure);
    setApprovalRemarks('');
    setShowApprovalModal(true);
  };

  const handleReject = (expenditure) => {
    setSelectedExpenditure(expenditure);
    setApprovalRemarks('');
    setShowApprovalModal(true);
  };

  const processApproval = async (action) => {
    if (!selectedExpenditure) return;

    setProcessing(true);
    try {
      if (action === 'approve') {
        await expenditureAPI.verifyExpenditure(selectedExpenditure._id, {
          remarks: approvalRemarks
        });
      } else {
        await expenditureAPI.rejectExpenditure(selectedExpenditure._id, {
          remarks: approvalRemarks
        });
      }

      setShowApprovalModal(false);
      setSelectedExpenditure(null);
      setApprovalRemarks('');
      await fetchExpenditures(); // Refresh the list
    } catch (err) {
      setError(`Failed to ${action} expenditure`);
      console.error(`Error ${action}ing expenditure:`, err);
    } finally {
      setProcessing(false);
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

  if (loading) {
    return (
      <div className="hod-dashboard-container">
        <div className="loading">Loading HOD dashboard...</div>
      </div>
    );
  }

  return (
    <div className="hod-dashboard-container">
      <PageHeader
        title="HOD Dashboard"
        subtitle="Manage expenditures from your department"
      />

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="expenditures-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ color: 'black' }}>
              {statusFilter === 'pending' ? 'Pending Approvals' :
                statusFilter === 'verified' ? 'Verified Expenditures' :
                  statusFilter === 'approved' ? 'Approved Expenditures' :
                    statusFilter === 'rejected' ? 'Rejected Expenditures' : 'Expenditures'}
            </h2>
            <span className="count-badge">{expenditures.length}</span>
          </div>

          <div className="filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #dee2e6' }}
            >
              <option value="pending">Pending Action</option>
              <option value="verified">Verified by Me</option>
              <option value="approved">Final Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {expenditures.length === 0 ? (
          <div className="no-expenditures">
            <div className="no-expenditures-icon">
              <CheckCircle size={18} />
            </div>
            <h3>No {statusFilter === 'pending' ? 'Pending Actions' : 'Items Found'}</h3>
            <p>
              {statusFilter === 'pending'
                ? 'All expenditures have been processed.'
                : `No expenditures found with status: ${statusFilter}`}
            </p>
          </div>
        ) : (
          <div className="expenditures-grid">
            {expenditures.map((expenditure) => (
              <div key={expenditure._id} className="card-standard expenditure-card">
                <div className="card-header">
                  <div className="bill-info">
                    <h3>{expenditure.billNumber}</h3>
                    <span className="amount">{formatCurrency(expenditure.billAmount)}</span>
                  </div>
                  <div className={`status-badge ${expenditure.status}`}>
                    {expenditure.status === 'pending' ? 'Awaiting Verification' :
                      expenditure.status === 'verified' ? 'Verified (Pending Approval)' :
                        expenditure.status === 'approved' ? 'Approved' :
                          expenditure.status === 'rejected' ? 'Rejected' : expenditure.status}
                  </div>
                </div>

                <div className="card-content">
                  <div className="info-row">
                    <span className="label">Department:</span>
                    <span className="value">{expenditure.department?.name || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Budget Head:</span>
                    <span className="value">{expenditure.budgetHead?.name || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Party:</span>
                    <span className="value">{expenditure.partyName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Bill Date:</span>
                    <span className="value">{formatDate(expenditure.billDate)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Submitted By:</span>
                    <span className="value">{expenditure.submittedBy?.name || 'Unknown'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Submitted At:</span>
                    <span className="value">{formatDate(expenditure.submittedAt)}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="expense-details">
                    <strong>Expense Details:</strong>
                    <p>{expenditure.expenseDetails}</p>
                  </div>

                  {expenditure.attachments && expenditure.attachments.length > 0 && (
                    <div className="attachments">
                      <strong>Attachments:</strong>
                      <div className="attachment-list">
                        {expenditure.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="attachment-link"
                          >
                            <Paperclip size={14} />
                            {attachment.originalName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="approval-chain" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                    <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#495057' }}>Approval Chain</h5>
                    <div className="timeline" style={{ fontSize: '0.85rem' }}>
                      <div className="timeline-item" style={{ marginBottom: '4px' }}>
                        <span style={{ color: '#6c757d', marginRight: '5px' }}>●</span>
                        Submitted by <strong>{expenditure.submittedBy?.name || 'User'}</strong>
                        <span style={{ color: '#adb5bd', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                          {new Date(expenditure.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {expenditure.approvalSteps?.map((step, index) => (
                        <div key={index} className="timeline-item" style={{ marginBottom: '4px' }}>
                          <span style={{ color: step.decision === 'reject' ? '#dc3545' : '#28a745', marginRight: '5px' }}>●</span>
                          <strong>{step.decision === 'verify' ? 'Verified' : step.decision === 'approve' ? 'Approved' : 'Rejected'}</strong> by {step.role.toUpperCase()}
                          <span style={{ color: '#adb5bd', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                            {new Date(step.timestamp).toLocaleDateString()}
                          </span>
                          {step.remarks && (
                            <div style={{ paddingLeft: '1rem', fontStyle: 'italic', color: '#6c757d', fontSize: '0.8rem' }}>
                              "{step.remarks}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {statusFilter === 'pending' && (
                    <div className="action-buttons">
                      <button
                        className="btn btn-success"
                        onClick={() => handleApprove(expenditure)}
                      >
                        <Check size={16} />
                        Verify
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleReject(expenditure)}
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedExpenditure && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Process Expenditure</h3>
              <button
                className="modal-close"
                onClick={() => setShowApprovalModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="expenditure-summary">
                <h4>{selectedExpenditure.billNumber}</h4>
                <p><strong>Amount:</strong> {formatCurrency(selectedExpenditure.billAmount)}</p>
                <p><strong>Department:</strong> {selectedExpenditure.departmentName}</p>
                <p><strong>Budget Head:</strong> {selectedExpenditure.budgetHeadName}</p>
                <p><strong>Party:</strong> {selectedExpenditure.partyName}</p>
              </div>

              <div className="form-group">
                <label htmlFor="remarks">Remarks</label>
                <textarea
                  id="remarks"
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder="Enter your remarks..."
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowApprovalModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={() => processApproval('approve')}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Verify'}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => processApproval('reject')}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HODDashboard;
