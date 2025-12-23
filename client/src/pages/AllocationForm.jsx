import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { allocationAPI, departmentsAPI, budgetHeadsAPI } from '../services/api';
import PageHeader from '../components/Common/PageHeader';
import { ArrowLeft, Save, X, IndianRupee } from 'lucide-react';
import './AllocationForm.css';

const AllocationForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [departments, setDepartments] = useState([]);
    const [budgetHeads, setBudgetHeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        department: '',
        budgetHead: '',
        allocatedAmount: '',
        financialYear: '2024-2025',
        remarks: ''
    });

    useEffect(() => {
        fetchInitialData();
        if (isEditMode) {
            fetchAllocation();
        }
    }, [id]);

    const fetchInitialData = async () => {
        try {
            const deptResponse = await departmentsAPI.getDepartments();
            setDepartments(deptResponse.data.data.departments);
            
            // Fetch all budget heads initially (will be filtered by department selection)
            const headResponse = await budgetHeadsAPI.getBudgetHeads();
            setBudgetHeads(headResponse.data.data.budgetHeads);
        } catch (err) {
            console.error('Error fetching initial data:', err);
            setError('Failed to fetch departments or budget heads');
        }
    };

    // Fetch budget heads when department changes
    useEffect(() => {
        const fetchBudgetHeadsForDepartment = async () => {
            if (formData.department && !isEditMode) {
                try {
                    const headResponse = await budgetHeadsAPI.getBudgetHeads({ department: formData.department });
                    setBudgetHeads(headResponse.data.data.budgetHeads);
                } catch (err) {
                    console.error('Error fetching budget heads:', err);
                }
            }
        };
        fetchBudgetHeadsForDepartment();
    }, [formData.department, isEditMode]);

    const fetchAllocation = async () => {
        try {
            setFetching(true);
            const response = await allocationAPI.getAllocationById(id);
            const allocation = response.data.data.allocation;
            setFormData({
                department: allocation.department?._id || allocation.department || '',
                budgetHead: allocation.budgetHead?._id || allocation.budgetHead || '',
                allocatedAmount: allocation.allocatedAmount.toString(),
                financialYear: allocation.financialYear,
                remarks: allocation.remarks || ''
            });
        } catch (err) {
            setError('Failed to fetch allocation data');
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

        // Reset budget head when department changes (for new allocations only)
        if (name === 'department' && !isEditMode) {
            setFormData(prev => ({
                ...prev,
                budgetHead: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            setLoading(true);
            if (isEditMode) {
                await allocationAPI.updateAllocation(id, formData);
            } else {
                await allocationAPI.createAllocation(formData);
            }
            navigate('/allocations');
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} allocation`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="allocation-form-loading">
                <div className="loading-spinner"></div>
                <p>Loading allocation data...</p>
            </div>
        );
    }

    return (
        <div className="add-allocation-container">
            <PageHeader
                title={isEditMode ? "Edit Allocation" : "Add New Allocation"}
                subtitle={isEditMode ? "Update budget allocation details" : "Allocate budget to a department and budget head"}
            >
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/allocations')}>
                    <ArrowLeft size={18} /> Back to Allocations
                </button>
            </PageHeader>

            <div className="add-allocation-card">
                <form onSubmit={handleSubmit} className="add-allocation-form">
                    {error && (
                        <div className="alert alert-error mb-4">
                            <X size={20} className="mr-2" onClick={() => setError(null)} style={{ cursor: 'pointer' }} />
                            {error}
                        </div>
                    )}

                    <div className="form-sections-grid">
                        <div className="form-section">
                            <h3 className="section-title">Allocation Details</h3>
                            
                            <div className="form-group">
                                <label htmlFor="department">Department *</label>
                                <select
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isEditMode}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                                    ))}
                                </select>
                                {isEditMode && <small>Department cannot be changed after allocation</small>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="budgetHead">Budget Head *</label>
                                <select
                                    id="budgetHead"
                                    name="budgetHead"
                                    value={formData.budgetHead}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isEditMode}
                                >
                                    <option value="">Select Budget Head</option>
                                    {budgetHeads.map(head => (
                                        <option key={head._id} value={head._id}>{head.name} ({head.code})</option>
                                    ))}
                                </select>
                                {isEditMode && <small>Budget head cannot be changed after allocation</small>}
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Financial Information</h3>
                            
                            <div className="form-group">
                                <label htmlFor="allocatedAmount">Allocated Amount *</label>
                                <div className="amount-input-wrapper">
                                    <input
                                        type="number"
                                        id="allocatedAmount"
                                        name="allocatedAmount"
                                        value={formData.allocatedAmount}
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
                                <label htmlFor="financialYear">Financial Year *</label>
                                <input
                                    type="text"
                                    id="financialYear"
                                    name="financialYear"
                                    value={formData.financialYear}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., 2024-2025"
                                    disabled={isEditMode}
                                />
                                {isEditMode && <small>Financial year cannot be changed after allocation</small>}
                            </div>
                        </div>

                        <div className="form-section full-width">
                            <h3 className="section-title">Additional Information</h3>
                            <div className="form-group">
                                <label htmlFor="remarks">Remarks</label>
                                <textarea
                                    id="remarks"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    placeholder="Enter any additional notes or remarks..."
                                    rows="4"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/allocations')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (
                                <>
                                    <Save size={18} className="mr-2" /> {isEditMode ? 'Update Allocation' : 'Create Allocation'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AllocationForm;
