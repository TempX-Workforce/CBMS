import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expenditureAPI, allocationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ResubmitExpenditure.css';

const ResubmitExpenditure = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [expenditure, setExpenditure] = useState(null);
  const [allocations, setAllocations] = useState([]);
  
  const [formData, setFormData] = useState({
    billNumber: '',
    billDate: '',
    billAmount: '',
    partyName: '',
    expenseDetails: '',
    referenceBudgetRegisterNo: '',
    remarks: '',
    attachments: []
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchExpenditure();
    fetchAllocations();
  }, [id]);

  const fetchExpenditure = async () => {
    try {
      const response = await expenditureAPI.getExpenditureById(id);
      const expenditureData = response.data.data.expenditure;
      
      setExpenditure(expenditureData);
      
      // Pre-fill form with original data
      setFormData({
        billNumber: expenditureData.billNumber,
        billDate: expenditureData.billDate.split('T')[0],
        billAmount: expenditureData.billAmount,
        partyName: expenditureData.partyName,
        expenseDetails: expenditureData.expenseDetails,
        referenceBudgetRegisterNo: expenditureData.referenceBudgetRegisterNo || '',
        remarks: '',
        attachments: []
      });
    } catch (err) {
      setError('Failed to fetch expenditure details');
      console.error('Error fetching expenditure:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async () => {
    try {
      const response = await allocationAPI.getAllocations({
        departmentId: user.department,
        limit: 100
      });
      setAllocations(response.data.data.allocations);
    } catch (err) {
      console.error('Error fetching allocations:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.billNumber.trim()) newErrors.billNumber = 'Bill number is required';
    if (!formData.billDate) newErrors.billDate = 'Bill date is required';
    if (!formData.billAmount || formData.billAmount <= 0) newErrors.billAmount = 'Valid bill amount is required';
    if (!formData.partyName.trim()) newErrors.partyName = 'Party name is required';
    if (!formData.expenseDetails.trim()) newErrors.expenseDetails = 'Expense details are required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('billNumber', formData.billNumber);
      formDataToSend.append('billDate', formData.billDate);
      formDataToSend.append('billAmount', formData.billAmount);
      formDataToSend.append('partyName', formData.partyName);
      formDataToSend.append('expenseDetails', formData.expenseDetails);
      formDataToSend.append('referenceBudgetRegisterNo', formData.referenceBudgetRegisterNo);
      formDataToSend.append('remarks', formData.remarks);

      // Append files
      formData.attachments.forEach((file, index) => {
        formDataToSend.append('attachments', file);
      });

      const response = await expenditureAPI.resubmitExpenditure(id, formDataToSend);

      if (response.data.success) {
        navigate('/expenditures', { 
          state: { message: 'Expenditure resubmitted successfully!' } 
        });
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error resubmitting expenditure:', err);
      setError(err.response?.data?.message || 'Failed to resubmit expenditure. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/expenditures');
  };

  if (loading) {
    return (
      <div className="resubmit-expenditure-container">
        <div className="loading">Loading expenditure details...</div>
      </div>
    );
  }

  if (!expenditure) {
    return (
      <div className="resubmit-expenditure-container">
        <div className="error-message">Expenditure not found</div>
      </div>
    );
  }

  if (expenditure.status !== 'rejected') {
    return (
      <div className="resubmit-expenditure-container">
        <div className="error-message">Only rejected expenditures can be resubmitted</div>
      </div>
    );
  }

  return (
    <div className="resubmit-expenditure-container">
      <div className="resubmit-header">
        <h1>Resubmit Expenditure</h1>
        <p>Correct the issues and resubmit your expenditure request</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="original-expenditure-info">
        <h3>Original Expenditure Details</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Bill Number:</span>
            <span className="value">{expenditure.billNumber}</span>
          </div>
          <div className="info-item">
            <span className="label">Department:</span>
            <span className="value">{expenditure.departmentName}</span>
          </div>
          <div className="info-item">
            <span className="label">Budget Head:</span>
            <span className="value">{expenditure.budgetHeadName}</span>
          </div>
          <div className="info-item">
            <span className="label">Status:</span>
            <span className="value status-rejected">{expenditure.status}</span>
          </div>
        </div>
        
        {expenditure.remarks && (
          <div className="rejection-reason">
            <h4>Rejection Reason:</h4>
            <p>{expenditure.remarks}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="resubmit-form">
        <div className="form-section">
          <h3>Expenditure Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="billNumber">Bill Number *</label>
              <input
                type="text"
                id="billNumber"
                name="billNumber"
                value={formData.billNumber}
                onChange={handleInputChange}
                className={errors.billNumber ? 'error' : ''}
                placeholder="Enter bill number"
              />
              {errors.billNumber && <span className="error-text">{errors.billNumber}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="billDate">Bill Date *</label>
              <input
                type="date"
                id="billDate"
                name="billDate"
                value={formData.billDate}
                onChange={handleInputChange}
                className={errors.billDate ? 'error' : ''}
              />
              {errors.billDate && <span className="error-text">{errors.billDate}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="billAmount">Bill Amount (₹) *</label>
              <input
                type="number"
                id="billAmount"
                name="billAmount"
                value={formData.billAmount}
                onChange={handleInputChange}
                className={errors.billAmount ? 'error' : ''}
                placeholder="Enter bill amount"
                min="0"
                step="0.01"
              />
              {errors.billAmount && <span className="error-text">{errors.billAmount}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="partyName">Party Name *</label>
              <input
                type="text"
                id="partyName"
                name="partyName"
                value={formData.partyName}
                onChange={handleInputChange}
                className={errors.partyName ? 'error' : ''}
                placeholder="Enter party name"
              />
              {errors.partyName && <span className="error-text">{errors.partyName}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="expenseDetails">Expense Details *</label>
            <textarea
              id="expenseDetails"
              name="expenseDetails"
              value={formData.expenseDetails}
              onChange={handleInputChange}
              className={errors.expenseDetails ? 'error' : ''}
              placeholder="Describe the expense details"
              rows="4"
            />
            {errors.expenseDetails && <span className="error-text">{errors.expenseDetails}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="referenceBudgetRegisterNo">Reference Budget Register No</label>
            <input
              type="text"
              id="referenceBudgetRegisterNo"
              name="referenceBudgetRegisterNo"
              value={formData.referenceBudgetRegisterNo}
              onChange={handleInputChange}
              placeholder="Enter reference number (optional)"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Attachments</h3>
          <div className="form-group">
            <label htmlFor="attachments">Upload Supporting Documents</label>
            <input
              type="file"
              id="attachments"
              name="attachments"
              onChange={handleFileChange}
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <small className="file-help">
              Supported formats: PDF, JPG, PNG. Maximum 5 files, 10MB each.
            </small>
          </div>
        </div>

        <div className="form-section">
          <h3>Resubmission Notes</h3>
          <div className="form-group">
            <label htmlFor="remarks">Remarks</label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Explain the changes made or corrections applied"
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? (
              <>
                <span className="spinner"></span>
                Resubmitting...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                Resubmit Expenditure
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResubmitExpenditure;
