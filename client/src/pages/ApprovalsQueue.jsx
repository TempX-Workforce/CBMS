import React, { useState, useEffect } from 'react';
import { expenditureAPI } from '../services/api';
import Tooltip from '../components/Tooltip/Tooltip';
import { Check, X, Search, FileText } from 'lucide-react';
import './ApprovalsQueue.css';

const ApprovalsQueue = () => {
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpenditure, setSelectedExpenditure] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [filters, setFilters] = useState({ search: '', status: 'pending' });

  useEffect(() => {
    fetchExpenditures();
  }, [filters]);

  const fetchExpenditures = async () => {
    try {
      setLoading(true);
      const res = await expenditureAPI.getExpenditures(filters);
      setExpenditures(res.data.data.expenditures);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (exp, type) => {
    setSelectedExpenditure(exp);
    setActionType(type);
    setShowModal(true);
  };

  const processAction = async () => {
    try {
      if (actionType === 'approve') {
        await expenditureAPI.approveExpenditure(selectedExpenditure._id, { remarks });
      } else {
        await expenditureAPI.rejectExpenditure(selectedExpenditure._id, { remarks });
      }
      setShowModal(false);
      setRemarks('');
      fetchExpenditures();
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="approvals-queue-container">
      <div className="approvals-header">
        <h1 className="page-title">Approvals</h1>
        <div className="queue-stats">
          <div className="stat-badge pending">
            <span>Pending: {expenditures.filter(e => e.status === 'pending').length}</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="#9ca3af" />
            <input 
              type="text" 
              placeholder="Search by Bill Number or Department..." 
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              style={{ border: 'none', outline: 'none', width: '100%' }}
            />
          </div>
        </div>
        <div className="filter-group" style={{ maxWidth: '200px' }}>
          <select 
            className="form-select"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="approvals-table">
          <thead>
            <tr>
              <th>Bill Details</th>
              <th>Department / Head</th>
              <th>Party Name</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenditures.map((exp) => (
              <tr key={exp._id}>
                <td>
                  <strong>{exp.billNumber}</strong>
                </td>
                <td>
                  <div className="department-info">
                    <span className="dept-name">{exp.departmentName}</span>
                    <span className="budget-head">{exp.budgetHeadName}</span>
                  </div>
                </td>
                <td>{exp.partyName}</td>
                <td className="date-text">{new Date(exp.billDate).toLocaleDateString('en-IN')}</td>
                <td className="amount-text">{formatCurrency(exp.billAmount)}</td>
                <td>
                  <span className={`status-badge ${exp.status}`}>
                    {exp.status}
                  </span>
                </td>
                <td>
                  {exp.status === 'pending' && (
                    <div className="action-buttons">
                      <Tooltip text="Approve" position="top">
                        <button className="btn-icon approve" onClick={() => handleAction(exp, 'approve')}>
                          <Check size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip text="Reject" position="top">
                        <button className="btn-icon reject" onClick={() => handleAction(exp, 'reject')}>
                          <X size={16} />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                  {exp.status !== 'pending' && <span className="date-text">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{actionType === 'approve' ? 'Approve Expenditure' : 'Reject Expenditure'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to {actionType} <strong>{selectedExpenditure?.billNumber}</strong>?</p>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Remarks</label>
                <textarea 
                  className="form-textarea"
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button 
                className={`btn ${actionType === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                onClick={processAction}
              >
                Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsQueue;