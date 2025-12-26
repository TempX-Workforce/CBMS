import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { incomeAPI, financialYearAPI } from '../services/api';
import PageHeader from '../components/Common/PageHeader';
import Tooltip from '../components/Tooltip/Tooltip';
import { Plus, IndianRupee, TrendingUp, CheckCircle, Clock, Pencil, Trash2, CheckSquare } from 'lucide-react';
import './IncomeReceipts.css';

const IncomeReceipts = () => {
    const [incomes, setIncomes] = useState([]);
    const [stats, setStats] = useState(null);
    const [financialYears, setFinancialYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        financialYear: '',
        source: '',
        status: '',
        category: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const canVerify = ['principal', 'admin'].includes(user.role);
    const canDelete = ['admin'].includes(user.role);

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const params = {};
            if (filters.financialYear) params.financialYear = filters.financialYear;
            if (filters.source) params.source = filters.source;
            if (filters.status) params.status = filters.status;
            if (filters.category) params.category = filters.category;

            const [incomesResponse, statsResponse, yearsResponse] = await Promise.all([
                incomeAPI.getIncomes(params),
                incomeAPI.getIncomeStats(params),
                financialYearAPI.getFinancialYears()
            ]);

            setIncomes(incomesResponse.data.data.incomes || []);
            setStats(statsResponse.data.data || {});
            setFinancialYears(yearsResponse.data.data.financialYears || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch income data');
            console.error('Error fetching data:', err);
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

    const handleVerify = async (id) => {
        if (!window.confirm('Verify this income record? This action confirms the funds have been received and verified.')) {
            return;
        }

        try {
            const remarks = prompt('Enter verification remarks (optional):');
            await incomeAPI.verifyIncome(id, { remarks: remarks || 'Verified by Principal' });
            fetchData(); // Refresh list
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to verify income');
            console.error('Error verifying income:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this income record? This action cannot be undone.')) {
            return;
        }

        try {
            await incomeAPI.deleteIncome(id);
            fetchData(); // Refresh list
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete income');
            console.error('Error deleting income:', err);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            expected: 'status-expected',
            received: 'status-received',
            verified: 'status-verified'
        };
        return classes[status] || '';
    };

    const sourceLabels = {
        government_grant: 'Government Grant',
        student_fees: 'Student Fees',
        donation: 'Donation',
        research_grant: 'Research Grant',
        consultancy: 'Consultancy',
        other: 'Other'
    };

    if (loading) {
        return (
            <div className="income-receipts-container">
                <div className="loading">Loading income records...</div>
            </div>
        );
    }

    return (
        <div className="income-receipts-container">
            <PageHeader
                title="Income & Receipts Management"
                subtitle="Track institutional income, grants, and other fund receipts"
            >
                <Link to="/income/add" className="btn btn-primary">
                    <Plus size={18} /> Add Income Record
                </Link>
            </PageHeader>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {stats?.summary && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Clock size={32} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-number">₹{stats.summary.totalExpected?.toLocaleString('en-IN') || '0'}</div>
                            <div className="stat-label">Total Expected</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <TrendingUp size={32} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-number">₹{stats.summary.totalReceived?.toLocaleString('en-IN') || '0'}</div>
                            <div className="stat-label">Total Received</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <CheckCircle size={32} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-number">₹{stats.summary.totalVerified?.toLocaleString('en-IN') || '0'}</div>
                            <div className="stat-label">Total Verified</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <IndianRupee size={32} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-number">{stats.summary.receptionRate || '0'}%</div>
                            <div className="stat-label">Reception Rate</div>
                            <div className="stat-sublabel">
                                Pending: ₹{stats.summary.pending?.toLocaleString('en-IN') || '0'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="filters-section">
                <div className="filter-group">
                    <select
                        name="financialYear"
                        value={filters.financialYear}
                        onChange={handleFilterChange}
                        className="filter-select"
                    >
                        <option value="">All Financial Years</option>
                        {financialYears.map(fy => (
                            <option key={fy._id} value={fy.year}>{fy.year}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <select
                        name="source"
                        value={filters.source}
                        onChange={handleFilterChange}
                        className="filter-select"
                    >
                        <option value="">All Sources</option>
                        {Object.entries(sourceLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="filter-select"
                    >
                        <option value="">All Status</option>
                        <option value="expected">Expected</option>
                        <option value="received">Received</option>
                        <option value="verified">Verified</option>
                    </select>
                </div>
                <div className="filter-group">
                    <select
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        className="filter-select"
                    >
                        <option value="">All Categories</option>
                        <option value="recurring">Recurring</option>
                        <option value="non-recurring">Non-Recurring</option>
                    </select>
                </div>
            </div>

            <div className="income-table-container">
                <table className="income-table">
                    <thead>
                        <tr>
                            <th>FY</th>
                            <th>Source</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Category</th>
                            <th>Expected Date</th>
                            <th>Received Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incomes.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="no-data">
                                    No income records found. Click "Add Income Record" to create one.
                                </td>
                            </tr>
                        ) : (
                            incomes.map((income) => (
                                <tr key={income._id}>
                                    <td>{income.financialYear}</td>
                                    <td>
                                        <div className="source-info">
                                            <span className="source-name">{sourceLabels[income.source]}</span>
                                            {income.referenceNumber && (
                                                <span className="ref-number">Ref: {income.referenceNumber}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="description-cell">
                                            {income.description}
                                        </div>
                                    </td>
                                    <td className="amount">₹{income.amount?.toLocaleString('en-IN') || '0'}</td>
                                    <td>
                                        <span className={`category-badge category-${income.category}`}>
                                            {income.category}
                                        </span>
                                    </td>
                                    <td>{formatDate(income.expectedDate)}</td>
                                    <td>{formatDate(income.receivedDate)}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(income.status)}`}>
                                            {income.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <Tooltip text="Edit Income" position="top">
                                                <Link
                                                    to={`/income/edit/${income._id}`}
                                                    className="btn btn-sm btn-secondary"
                                                >
                                                    <Pencil size={16} />
                                                </Link>
                                            </Tooltip>
                                            {canVerify && income.status === 'received' && (
                                                <Tooltip text="Verify Income" position="top">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleVerify(income._id)}
                                                    >
                                                        <CheckSquare size={16} />
                                                    </button>
                                                </Tooltip>
                                            )}
                                            {canDelete && income.status !== 'verified' && (
                                                <Tooltip text="Delete Income" position="top">
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(income._id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default IncomeReceipts;
