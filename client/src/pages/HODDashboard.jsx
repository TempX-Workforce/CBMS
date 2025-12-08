import React, { useState, useEffect } from 'react';
import { expenditureAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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

  useEffect(() => {
    fetchExpenditures();
  }, []);

  const fetchExpenditures = async () => {
    try {
      setLoading(true);
      const response = await expenditureAPI.getExpenditures({
        departmentId: user.department,
        status: 'pending',
        currentApprover: 'hod'
      });
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
        await expenditureAPI.approveExpenditure(selectedExpenditure._id, {
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
      <div className="dashboard-header">
        <h1>HOD Dashboard</h1>
        <p>Manage expenditures from your department</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="expenditures-section">
        <div className="section-header">
          <h2>Pending Approvals</h2>
          <span className="count-badge">{expenditures.length}</span>
        </div>

        {expenditures.length === 0 ? (
          <div className="no-expenditures">
            <div className="no-expenditures-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>No Pending Approvals</h3>
            <p>All expenditures from your department have been processed.</p>
          </div>
        ) : (
          <div className="expenditures-grid">
            {expenditures.map((expenditure) => (
              <div key={expenditure._id} className="expenditure-card">
                <div className="card-header">
                  <div className="bill-info">
                    <h3>{expenditure.billNumber}</h3>
                    <span className="amount">{formatCurrency(expenditure.billAmount)}</span>
                  </div>
                  <div className="status-badge pending">
                    Awaiting HOD Approval
                  </div>
                </div>

                <div className="card-content">
                  <div className="info-row">
                    <span className="label">Department:</span>
                    <span className="value">{expenditure.departmentName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Budget Head:</span>
                    <span className="value">{expenditure.budgetHeadName}</span>
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
                    <span className="value">{expenditure.submittedByName}</span>
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
                            <i className="fas fa-paperclip"></i>
                            {attachment.originalName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="action-buttons">
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(expenditure)}
                    >
                      <i className="fas fa-check"></i>
                      Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(expenditure)}
                    >
                      <i className="fas fa-times"></i>
                      Reject
                    </button>
                  </div>
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
                <i className="fas fa-times"></i>
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
                {processing ? 'Processing...' : 'Approve'}
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
