import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { budgetHeadsAPI, allocationAPI, expenditureAPI, settingsAPI } from '../services/api';
import './SubmitExpenditure.css';

const SubmitExpenditure = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    budgetHeadId: '',
    billNumber: '',
    billDate: '',
    billAmount: '',
    partyName: '',
    expenseDetails: '',
    referenceBudgetRegisterNo: '',
    attachments: []
  });

  const [budgetHeads, setBudgetHeads] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [overspendPolicy, setOverspendPolicy] = useState('disallow');

  useEffect(() => {
    if (user?.role !== 'department') {
      navigate('/dashboard');
      return;
    }

    fetchBudgetHeads();
    fetchAllocations();
    fetchSettings();
  }, [user, navigate]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getPublicSettings();
      if (response.data.success) {
        setOverspendPolicy(response.data.data.budget_overspend_policy || 'disallow');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    if (formData.budgetHeadId) {
      const allocation = allocations.find(
        alloc => alloc.budgetHeadId === formData.budgetHeadId
      );
      if (allocation) {
        setRemainingBudget(allocation.remainingAmount);
      }
    }
  }, [formData.budgetHeadId, allocations]);

  const fetchBudgetHeads = async () => {
    try {
      const response = await budgetHeadsAPI.getBudgetHeads({ isActive: true });
      setBudgetHeads(response.data.data.budgetHeads);
    } catch (error) {
      console.error('Error fetching budget heads:', error);
    }
  };

  const fetchAllocations = async () => {
    try {
      const currentYear = getCurrentFinancialYear();
      const response = await allocationAPI.getAllocations({
        financialYear: currentYear,
        departmentId: user.department
      });
      setAllocations(response.data.data.allocations);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
  };

  const getCurrentFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const handleChange = (e) => {
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
    const validFiles = files.filter(file => {
      const isValidType = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setErrors(prev => ({
        ...prev,
        attachments: 'Only PDF, JPG, and PNG files up to 10MB are allowed'
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        attachments: ''
      }));
    }

    setFormData(prev => ({
      ...prev,
      attachments: validFiles
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.budgetHeadId) newErrors.budgetHeadId = 'Budget head is required';
    if (!formData.billNumber.trim()) newErrors.billNumber = 'Bill number is required';
    if (!formData.billDate) newErrors.billDate = 'Bill date is required';
    if (!formData.billAmount || parseFloat(formData.billAmount) <= 0) {
      newErrors.billAmount = 'Valid bill amount is required';
    }
    if (!formData.partyName.trim()) newErrors.partyName = 'Party name is required';
    if (!formData.expenseDetails.trim()) newErrors.expenseDetails = 'Expense details are required';

    // Check if bill amount exceeds remaining budget
    if (formData.billAmount && parseFloat(formData.billAmount) > remainingBudget) {
      if (overspendPolicy === 'disallow') {
        newErrors.billAmount = `Bill amount exceeds remaining budget (₹${remainingBudget.toLocaleString()}). Overspend is not allowed.`;
      } else {
        // Warning only
        // We'll handle this in the return to allow submission
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('budgetHead', formData.budgetHeadId);
      formDataToSend.append('billNumber', formData.billNumber);
      formDataToSend.append('billDate', formData.billDate);
      formDataToSend.append('billAmount', formData.billAmount);
      formDataToSend.append('partyName', formData.partyName);
      formDataToSend.append('expenseDetails', formData.expenseDetails);
      formDataToSend.append('referenceBudgetRegisterNo', formData.referenceBudgetRegisterNo);
      // Append files
      formData.attachments.forEach((file, index) => {
        formDataToSend.append('attachments', file);
      });

      const response = await expenditureAPI.submitExpenditure(formDataToSend);

      if (response.data.success) {
        navigate('/expenditures', {
          state: { message: 'Expenditure submitted successfully!' }
        });
      } else {
        setErrors({ submit: response.data.message });
      }
    } catch (error) {
      console.error('Error submitting expenditure:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to submit expenditure. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="submit-expenditure-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="submit-expenditure-container">
      <div className="page-header">
        <h1 className="page-title">Submit Expenditure</h1>
        <p className="page-subtitle">Submit a new expenditure request for approval</p>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} className="expenditure-form">
          {errors.submit && (
            <div className="alert alert-danger">
              <LuAlertCircle size={20} />
              {errors.submit}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="budgetHead" className="form-label">
                Budget Head *
              </label>
              <select
                id="budgetHeadId"
                name="budgetHeadId"
                value={formData.budgetHeadId}
                onChange={handleChange}
                className={`form-input ${errors.budgetHeadId ? 'error' : ''}`}
              >
                <option value="">Select Budget Head</option>
                {budgetHeads.map((head) => (
                  <option key={head._id} value={head._id}>
                    {head.name} ({head.category})
                  </option>
                ))}
              </select>
              {errors.budgetHeadId && (
                <span className="form-error">{errors.budgetHeadId}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="billNumber" className="form-label">
                Bill Number *
              </label>
              <input
                type="text"
                id="billNumber"
                name="billNumber"
                value={formData.billNumber}
                onChange={handleChange}
                className={`form-input ${errors.billNumber ? 'error' : ''}`}
                placeholder="Enter bill number"
              />
              {errors.billNumber && (
                <span className="form-error">{errors.billNumber}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="billDate" className="form-label">
                Bill Date *
              </label>
              <input
                type="date"
                id="billDate"
                name="billDate"
                value={formData.billDate}
                onChange={handleChange}
                className={`form-input ${errors.billDate ? 'error' : ''}`}
              />
              {errors.billDate && (
                <span className="form-error">{errors.billDate}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="billAmount" className="form-label">
                Bill Amount *
              </label>
              <input
                type="number"
                id="billAmount"
                name="billAmount"
                value={formData.billAmount}
                onChange={handleChange}
                className={`form-input ${errors.billAmount ? 'error' : ''}`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.billAmount && (
                <span className="form-error">{errors.billAmount}</span>
              )}
              {remainingBudget > 0 && (
                <span className="form-help">
                  Remaining budget: {formatCurrency(remainingBudget)}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="partyName" className="form-label">
              Party Name *
            </label>
            <input
              type="text"
              id="partyName"
              name="partyName"
              value={formData.partyName}
              onChange={handleChange}
              className={`form-input ${errors.partyName ? 'error' : ''}`}
              placeholder="Enter party/vendor name"
            />
            {errors.partyName && (
              <span className="form-error">{errors.partyName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="expenseDetails" className="form-label">
              Expense Details *
            </label>
            <textarea
              id="expenseDetails"
              name="expenseDetails"
              value={formData.expenseDetails}
              onChange={handleChange}
              className={`form-input ${errors.expenseDetails ? 'error' : ''}`}
              placeholder="Describe the expenses incurred..."
              rows="4"
            />
            {errors.expenseDetails && (
              <span className="form-error">{errors.expenseDetails}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="referenceBudgetRegisterNo" className="form-label">
              Reference Budget Register No
            </label>
            <input
              type="text"
              id="referenceBudgetRegisterNo"
              name="referenceBudgetRegisterNo"
              value={formData.referenceBudgetRegisterNo}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter reference number (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="attachments" className="form-label">
              Attachments
            </label>
            <input
              type="file"
              id="attachments"
              name="attachments"
              onChange={handleFileChange}
              className="form-input"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <span className="form-help">
              Upload supporting documents (PDF, JPG, PNG). Maximum 10MB per file, up to 5 files.
            </span>
            {errors.attachments && (
              <span className="form-error">{errors.attachments}</span>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/expenditures')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                'Submit Expenditure'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitExpenditure;
