import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { incomeAPI, financialYearAPI } from '../services/api';
import PageHeader from '../components/Common/PageHeader';
import { ArrowLeft, Save, IndianRupee } from 'lucide-react';
import './IncomeForm.css';

const IncomeForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [financialYears, setFinancialYears] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        financialYear: '',
        source: '',
        category: 'recurring',
        amount: '',
        expectedDate: '',
        receivedDate: '',
        status: 'expected',
        referenceNumber: '',
        description: '',
        remarks: ''
    });

    const sourceOptions = [
        { value: 'government_grant', label: 'Government Grant' },
        { value: 'student_fees', label: 'Student Fees' },
        { value: 'donation', label: 'Donation' },
        { value: 'research_grant', label: 'Research Grant' },
        { value: 'consultancy', label: 'Consultancy' },
        { value: 'other', label: 'Other' }
    ];

    const statusOptions = [
        { value: 'expected', label: 'Expected' },
        { value: 'received', label: 'Received' },
        { value: 'verified', label: 'Verified' }
    ];

    useEffect(() => {
        fetchFinancialYears();
        if (isEditMode) {
            fetchIncome();
        }
    }, [id, isEditMode]);

    const fetchFinancialYears = async () => {
        try {
            const response = await financialYearAPI.getFinancialYears();
            setFinancialYears(response.data.data.financialYears);

            // Set active year as default for new income
            if (!isEditMode) {
                const activeYear = response.data.data.financialYears.find(fy => fy.status === 'active');
                if (activeYear) {
                    setFormData(prev => ({ ...prev, financialYear: activeYear.year }));
                }
            }
        } catch (err) {
            console.error('Error fetching financial years:', err);
            setError('Failed to fetch financial years');
        }
    };

    const fetchIncome = async () => {
        try {
            setFetching(true);
            const response = await incomeAPI.getIncomeById(id);
            const income = response.data.data.income;

            setFormData({
                financialYear: income.financialYear || '',
                source: income.source || '',
                category: income.category || 'recurring',
                amount: income.amount?.toString() || '',
                expectedDate: income.expectedDate ? income.expectedDate.split('T')[0] : '',
                receivedDate: income.receivedDate ? income.receivedDate.split('T')[0] : '',
                status: income.status || 'expected',
                referenceNumber: income.referenceNumber || '',
                description: income.description || '',
                remarks: income.remarks || ''
            });
        } catch (err) {
            setError('Failed to fetch income data');
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (formData.status === 'received' && !formData.receivedDate) {
            setError('Received date is required when status is "Received"');
            return;
        }

        try {
            setLoading(true);
            const submitData = {
                ...formData,
                amount: parseFloat(formData.amount)
            };

            if (isEditMode) {
                await incomeAPI.updateIncome(id, submitData);
            } else {
                await incomeAPI.createIncome(submitData);
            }
            navigate('/income');
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} income record`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="income-form-loading">
                <div className="loading-spinner"></div>
                <p>Loading income data...</p>
            </div>
        );
    }

    return (
        <div className="income-form-container">
            <PageHeader
                title={isEditMode ? "Edit Income Record" : "Add New Income"}
                subtitle={isEditMode ? "Update income/receipt details" : "Record expected or received institutional income"}
            >
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/income')}>
                    <ArrowLeft size={18} /> Back to Income
                </button>
            </PageHeader>

            <div className="income-form-card">
                <form onSubmit={handleSubmit} className="income-form">
                    {error && (
                        <div className="alert alert-error mb-4">
                            {error}
                        </div>
                    )}

                    <div className="form-sections-grid">
                        <div className="form-section">
                            <h3 className="section-title">Income Source</h3>

                            <div className="form-group">
                                <label htmlFor="financialYear">Financial Year *</label>
                                <select
                                    id="financialYear"
                                    name="financialYear"
                                    value={formData.financialYear}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isEditMode}
                                >
                                    <option value="">Select Financial Year</option>
                                    {financialYears.map(fy => (
                                        <option key={fy._id} value={fy.year}>
                                            {fy.year} ({fy.status})
                                        </option>
                                    ))}
                                </select>
                                {isEditMode && <small>Financial year cannot be changed</small>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="source">Source *</label>
                                <select
                                    id="source"
                                    name="source"
                                    value={formData.source}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Source</option>
                                    {sourceOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="category">Category *</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="recurring">Recurring</option>
                                    <option value="non-recurring">Non-Recurring</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">Status *</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    required
                                >
                                    {statusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <small>Verification can only be done by Principal</small>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Amount & Dates</h3>

                            <div className="form-group">
                                <label htmlFor="amount">Amount *</label>
                                <div className="amount-input-wrapper">
                                    <input
                                        type="number"
                                        id="amount"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter amount"
                                    />
                                    <IndianRupee size={16} className="lucide-indian-rupee" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="expectedDate">Expected Date *</label>
                                <input
                                    type="date"
                                    id="expectedDate"
                                    name="expectedDate"
                                    value={formData.expectedDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="receivedDate">
                                    Received Date {formData.status !== 'expected' && '*'}
                                </label>
                                <input
                                    type="date"
                                    id="receivedDate"
                                    name="receivedDate"
                                    value={formData.receivedDate}
                                    onChange={handleInputChange}
                                    required={formData.status !== 'expected'}
                                />
                                <small>Required when status is Received or Verified</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="referenceNumber">Reference Number</label>
                                <input
                                    type="text"
                                    id="referenceNumber"
                                    name="referenceNumber"
                                    value={formData.referenceNumber}
                                    onChange={handleInputChange}
                                    placeholder="Transaction/Sanction reference"
                                />
                            </div>
                        </div>

                        <div className="form-section full-width">
                            <h3 className="section-title">Description & Remarks</h3>

                            <div className="form-group">
                                <label htmlFor="description">Description *</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe the income source (e.g., 'UGC General Grant FY 2025-26')"
                                    rows="3"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="remarks">Remarks</label>
                                <textarea
                                    id="remarks"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    placeholder="Additional notes or remarks..."
                                    rows="3"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/income')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (
                                <>
                                    <Save size={18} className="mr-2" /> {isEditMode ? 'Update Income' : 'Create Income'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IncomeForm;
