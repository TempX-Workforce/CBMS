import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenditureAPI } from '../services/api';
import Tooltip from '../components/Tooltip/Tooltip';
import { Search, RotateCcw, Eye, FileText } from 'lucide-react';
import './Expenditures.css';

const Expenditures = () => {
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
            <div className="page-header">
                <h1 className="page-title">My Expenditures</h1>
                <p className="page-subtitle">Track and manage your department's expenditure requests</p>
            </div>

            <div className="filters-section">
                <div className="filter-group search-group">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by Bill Number, Party..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))} // Reset to page 1 on filter change
                        className="filter-input"
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
                                                {exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <Tooltip text="View Details" position="top">
                                                    <button className="btn-icon secondary" onClick={() => handleView(exp)}>
                                                        <Eye size={18} />
                                                    </button>
                                                </Tooltip>

                                                {exp.status === 'rejected' && (
                                                    <Tooltip text="Resubmit" position="top">
                                                        <button className="btn-icon primary" onClick={() => handleResubmit(exp._id)}>
                                                            <RotateCcw size={18} />
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

export default Expenditures;
