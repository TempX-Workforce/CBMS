import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    expenditureAPI,
    budgetHeadsAPI,
    allocationAPI,
    settingsAPI
} from '../services/api';
import PageHeader from '../components/Common/PageHeader';
import Tooltip from '../components/Tooltip/Tooltip';
import {
    Search,
    RotateCcw,
    Eye,
    FileText,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Upload,
    X,
    ImageIcon,
    Send
} from 'lucide-react';
import './ExpenditureStyles.scss';

// --- Expenditures Component ---
export const Expenditures = () => {
    const navigate = useNavigate();
    const [expenditures, setExpenditures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpenditure, setSelectedExpenditure] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        financialYear: ''
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0
    });

    useEffect(() => {
        fetchExpenditures();
    }, [filters, pagination.current]);

    const fetchExpenditures = async () => {
        try {
            setLoading(true);
            const res = await expenditureAPI.getExpenditures({
                ...filters,
                page: pagination.current,
                limit: 10
            });
            setExpenditures(res.data.data.expenditures);
            setPagination(res.data.data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResubmit = (id) => {
        navigate(`/resubmit-expenditure/${id}`);
    };

    const handleView = (exp) => {
        setSelectedExpenditure(exp);
        setShowModal(true);
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current: newPage }));
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    const getStatusColor = (status) => {
        const colors = {
            pending: 'pending',
            approved: 'approved',
            rejected: 'rejected',
            verified: 'verified'
        };
        return colors[status] || '';
    };

    return (
        <div className="expenditures-container">
            <PageHeader
                title="My Expenditures"
                subtitle="Track and manage your department's expenditure requests"
            />

            <div className="filters-section">
                <div className="filter-group search-group">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by Bill Number, Party..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))} // Reset to page 1 on filter change
                        className="filter-input has-icon"
                    />
                </div>
                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="loading-state">Loading expenditures...</div>
                ) : expenditures.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><FileText size={48} /></div>
                        <h3>No Expenditures Found</h3>
                        <p>You haven't submitted any expenditures matching your criteria.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/submit-expenditure')}>
                            Submit New Expenditure
                        </button>
                    </div>
                ) : (
                    <>
                        <table className="expenditures-table">
                            <thead>
                                <tr>
                                    <th>Bill Number</th>
                                    <th>Budget Head</th>
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
                                        <td className="font-medium">{exp.billNumber}</td>
                                        <td>{exp.budgetHead?.name || exp.budgetHeadName}</td>
                                        <td>{exp.partyName}</td>
                                        <td>{new Date(exp.billDate).toLocaleDateString('en-IN')}</td>
                                        <td className="text-right font-medium">{formatCurrency(exp.billAmount)}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusColor(exp.status)}`}>
                                                {exp.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <Tooltip text="View Details" position="top">
                                                    <button className="btn btn-sm btn-secondary" onClick={() => handleView(exp)}>
                                                        <Eye size={16} />
                                                    </button>
                                                </Tooltip>

                                                {exp.status === 'rejected' && (
                                                    <Tooltip text="Resubmit" position="top">
                                                        <button className="btn btn-sm btn-primary" onClick={() => handleResubmit(exp._id)}>
                                                            <RotateCcw size={16} />
                                                        </button>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {pagination.pages > 1 && (
                            <div className="pagination">
                                <button
                                    disabled={pagination.current === 1}
                                    onClick={() => handlePageChange(pagination.current - 1)}
                                    className="btn btn-outline btn-sm"
                                >
                                    Previous
                                </button>
                                <div className="page-numbers">
                                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            className={`page-number ${pagination.current === page ? 'active' : ''}`}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    disabled={pagination.current === pagination.pages}
                                    onClick={() => handlePageChange(pagination.current + 1)}
                                    className="btn btn-outline btn-sm"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showModal && selectedExpenditure && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Expenditure Details</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Bill Number</label>
                                    <div>{selectedExpenditure.billNumber}</div>
                                </div>
                                <div className="detail-item">
                                    <label>Date</label>
                                    <div>{new Date(selectedExpenditure.billDate).toLocaleDateString('en-IN')}</div>
                                </div>
                                <div className="detail-item">
                                    <label>Budget Head</label>
                                    <div>{selectedExpenditure.budgetHead?.name} ({selectedExpenditure.budgetHead?.category})</div>
                                </div>
                                <div className="detail-item">
                                    <label>Amount</label>
                                    <div className="text-lg font-bold">{formatCurrency(selectedExpenditure.billAmount)}</div>
                                </div>
                                <div className="detail-item full-width">
                                    <label>Party Name</label>
                                    <div>{selectedExpenditure.partyName}</div>
                                </div>
                                <div className="detail-item full-width">
                                    <label>Details</label>
                                    <div className="text-muted">{selectedExpenditure.expenseDetails}</div>
                                </div>

                                {selectedExpenditure.status === 'rejected' && selectedExpenditure.approvalSteps && (
                                    <div className="detail-item full-width rejection-box">
                                        <label className="text-danger">Rejection Remarks</label>
                                        <div className="text-danger">
                                            {selectedExpenditure.approvalSteps.find(step => step.decision === 'reject')?.remarks || 'No remarks provided'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            {selectedExpenditure.status === 'rejected' && (
                                <button className="btn btn-primary" onClick={() => {
                                    setShowModal(false);
                                    handleResubmit(selectedExpenditure._id);
                                }}>
                                    Resubmit Now
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SubmitExpenditure Component ---
export const SubmitExpenditure = () => {
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
                department: user.department?._id || user.department,
                limit: 1000
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
            attachments: [...prev.attachments, ...validFiles]
        }));

        // Reset the input so the same file can be selected again if removed
        e.target.value = '';
    };

    const removeFile = (index) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const getFileIcon = (type) => {
        if (type.includes('pdf')) return <FileText size={20} />;
        if (type.includes('image')) return <ImageIcon size={20} />;
        return <FileText size={20} />;
    };

    const getFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        if (formData.billAmount) {
            const amount = parseFloat(formData.billAmount);
            const allocation = allocations.find(
                alloc => alloc.budgetHeadId === formData.budgetHeadId
            );

            if (!allocation) {
                newErrors.billAmount = 'No budget has been allocated for this budget head. Please contact admin to allocate funds.';
            } else if (amount > remainingBudget && overspendPolicy === 'disallow') {
                newErrors.billAmount = `Bill amount exceeds remaining budget (₹${remainingBudget.toLocaleString()}). Overspend is not allowed.`;
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
            <PageHeader
                title="Submit Expenditure"
                subtitle="Submit a new expenditure request for approval"
            />

            <div className="expenditure-form-container">
                <form onSubmit={handleSubmit} className="card-standard expenditure-form">
                    {errors.submit && (
                        <div className="alert alert-danger">
                            <AlertCircle size={20} />
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
                        <label className="form-label">Attachments</label>
                        <div className="file-upload-wrapper">
                            <div className="file-input-custom">
                                <div className="upload-icon-wrapper">
                                    <Upload size={32} />
                                </div>
                                <div className="upload-text">Choose files or drag and drop</div>
                                <div className="upload-hint">PDF, JPG, PNG up to 10MB</div>
                                <input
                                    type="file"
                                    id="attachments"
                                    name="attachments"
                                    onChange={handleFileChange}
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                            </div>
                            {errors.attachments && (
                                <span className="form-error">{errors.attachments}</span>
                            )}
                        </div>

                        {formData.attachments.length > 0 && (
                            <div className="attachment-list-modern">
                                {formData.attachments.map((file, index) => (
                                    <div key={index} className="attachment-item-modern">
                                        <div className="file-info-modern">
                                            <div className="file-icon-modern">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div className="file-details-modern">
                                                <div className="file-name-modern">{file.name}</div>
                                                <div className="file-size-modern">{getFileSize(file.size)}</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="remove-file-btn"
                                            title="Remove file"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
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

// --- ResubmitExpenditure Component ---
export const ResubmitExpenditure = () => {
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
                department: user.department?._id || user.department,
                limit: 1000
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
                            'Resubmitting...'
                        ) : (
                            <>
                                <Send size={16} />
                                Resubmit Expenditure
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
