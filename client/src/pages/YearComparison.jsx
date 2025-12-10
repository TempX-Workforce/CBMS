import React, { useState, useEffect } from 'react';
import { allocationAPI } from '../services/api';
import './YearComparison.css';

const YearComparison = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [filters, setFilters] = useState({
    currentYear: '2024-25',
    previousYear: '2023-24'
  });

  useEffect(() => {
    fetchComparisonData();
  }, [filters]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await allocationAPI.getYearComparison(filters);
      setComparisonData(response.data.data);
    } catch (err) {
      setError('Failed to fetch year comparison data');
      console.error('Error fetching year comparison:', err);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return 'fas fa-arrow-up';
    if (change < 0) return 'fas fa-arrow-down';
    return 'fas fa-minus';
  };

  const renderOverallComparison = () => {
    if (!comparisonData?.overallComparison) return null;

    const { overallComparison } = comparisonData;

    return (
      <div className="overall-comparison">
        <h3>Overall Year Comparison</h3>
        <div className="comparison-grid">
          <div className="comparison-card">
            <div className="card-header">
              <h4>Budget Allocation</h4>
              <div className="year-labels">
                <span className="current-year">{overallComparison.currentYear}</span>
                <span className="vs">vs</span>
                <span className="previous-year">{overallComparison.previousYear}</span>
              </div>
            </div>
            <div className="card-content">
              <div className="amount-row">
                <div className="amount-item">
                  <span className="label">Current Year:</span>
                  <span className="value">{formatCurrency(overallComparison.allocationChange.current)}</span>
                </div>
                <div className="amount-item">
                  <span className="label">Previous Year:</span>
                  <span className="value">{formatCurrency(overallComparison.allocationChange.previous)}</span>
                </div>
              </div>
              <div className={`change-indicator ${getChangeColor(overallComparison.allocationChange.change)}`}>
                <i className={getChangeIcon(overallComparison.allocationChange.change)}></i>
                <span className="change-amount">{formatCurrency(Math.abs(overallComparison.allocationChange.change))}</span>
                <span className="change-percentage">({overallComparison.allocationChange.changePercentage}%)</span>
              </div>
            </div>
          </div>

          <div className="comparison-card">
            <div className="card-header">
              <h4>Total Spending</h4>
              <div className="year-labels">
                <span className="current-year">{overallComparison.currentYear}</span>
                <span className="vs">vs</span>
                <span className="previous-year">{overallComparison.previousYear}</span>
              </div>
            </div>
            <div className="card-content">
              <div className="amount-row">
                <div className="amount-item">
                  <span className="label">Current Year:</span>
                  <span className="value">{formatCurrency(overallComparison.spendingChange.current)}</span>
                </div>
                <div className="amount-item">
                  <span className="label">Previous Year:</span>
                  <span className="value">{formatCurrency(overallComparison.spendingChange.previous)}</span>
                </div>
              </div>
              <div className={`change-indicator ${getChangeColor(overallComparison.spendingChange.change)}`}>
                <i className={getChangeIcon(overallComparison.spendingChange.change)}></i>
                <span className="change-amount">{formatCurrency(Math.abs(overallComparison.spendingChange.change))}</span>
                <span className="change-percentage">({overallComparison.spendingChange.changePercentage}%)</span>
              </div>
            </div>
          </div>

          <div className="comparison-card">
            <div className="card-header">
              <h4>Budget Utilization</h4>
              <div className="year-labels">
                <span className="current-year">{overallComparison.currentYear}</span>
                <span className="vs">vs</span>
                <span className="previous-year">{overallComparison.previousYear}</span>
              </div>
            </div>
            <div className="card-content">
              <div className="amount-row">
                <div className="amount-item">
                  <span className="label">Current Year:</span>
                  <span className="value">{overallComparison.utilizationChange.current}%</span>
                </div>
                <div className="amount-item">
                  <span className="label">Previous Year:</span>
                  <span className="value">{overallComparison.utilizationChange.previous}%</span>
                </div>
              </div>
              <div className={`change-indicator ${getChangeColor(overallComparison.utilizationChange.change)}`}>
                <i className={getChangeIcon(overallComparison.utilizationChange.change)}></i>
                <span className="change-amount">{Math.abs(overallComparison.utilizationChange.change)}%</span>
                <span className="change-percentage">change</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDepartmentComparison = () => {
    if (!comparisonData?.departmentComparison) return null;

    return (
      <div className="department-comparison">
        <h3>Department-wise Comparison</h3>
        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Allocation Change</th>
                <th>Spending Change</th>
                <th>Utilization Change</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.departmentComparison.map((dept, index) => (
                <tr key={index}>
                  <td className="department-name">{dept.departmentName}</td>
                  <td>
                    <div className="change-cell">
                      <div className="change-values">
                        <span className="current">{formatCurrency(dept.allocationChange.current)}</span>
                        <span className="previous">{formatCurrency(dept.allocationChange.previous)}</span>
                      </div>
                      <div className={`change-indicator ${getChangeColor(dept.allocationChange.change)}`}>
                        <i className={getChangeIcon(dept.allocationChange.change)}></i>
                        <span>{dept.allocationChange.changePercentage}%</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="change-cell">
                      <div className="change-values">
                        <span className="current">{formatCurrency(dept.spendingChange.current)}</span>
                        <span className="previous">{formatCurrency(dept.spendingChange.previous)}</span>
                      </div>
                      <div className={`change-indicator ${getChangeColor(dept.spendingChange.change)}`}>
                        <i className={getChangeIcon(dept.spendingChange.change)}></i>
                        <span>{dept.spendingChange.changePercentage}%</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="change-cell">
                      <div className="change-values">
                        <span className="current">{dept.utilizationChange.current}%</span>
                        <span className="previous">{dept.utilizationChange.previous}%</span>
                      </div>
                      <div className={`change-indicator ${getChangeColor(dept.utilizationChange.change)}`}>
                        <i className={getChangeIcon(dept.utilizationChange.change)}></i>
                        <span>{dept.utilizationChange.change}%</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBudgetHeadComparison = () => {
    if (!comparisonData?.budgetHeadComparison) return null;

    return (
      <div className="budget-head-comparison">
        <h3>Budget Head-wise Comparison</h3>
        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Budget Head</th>
                <th>Allocation Change</th>
                <th>Spending Change</th>
                <th>Utilization Change</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.budgetHeadComparison.map((head, index) => (
                <tr key={index}>
                  <td className="budget-head-name">{head.budgetHeadName}</td>
                  <td>
                    <div className="change-cell">
                      <div className="change-values">
                        <span className="current">{formatCurrency(head.allocationChange.current)}</span>
                        <span className="previous">{formatCurrency(head.allocationChange.previous)}</span>
                      </div>
                      <div className={`change-indicator ${getChangeColor(head.allocationChange.change)}`}>
                        <i className={getChangeIcon(head.allocationChange.change)}></i>
                        <span>{head.allocationChange.changePercentage}%</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="change-cell">
                      <div className="change-values">
                        <span className="current">{formatCurrency(head.spendingChange.current)}</span>
                        <span className="previous">{formatCurrency(head.spendingChange.previous)}</span>
                      </div>
                      <div className={`change-indicator ${getChangeColor(head.spendingChange.change)}`}>
                        <i className={getChangeIcon(head.spendingChange.change)}></i>
                        <span>{head.spendingChange.changePercentage}%</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="change-cell">
                      <div className="change-values">
                        <span className="current">{head.utilizationChange.current}%</span>
                        <span className="previous">{head.utilizationChange.previous}%</span>
                      </div>
                      <div className={`change-indicator ${getChangeColor(head.utilizationChange.change)}`}>
                        <i className={getChangeIcon(head.utilizationChange.change)}></i>
                        <span>{head.utilizationChange.change}%</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="year-comparison-container">
      <div className="year-comparison-header">
        <h1>Year-over-Year Comparison</h1>
        <p>Compare budget allocations and spending between financial years</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="year-comparison-controls">
        <div className="year-selectors">
          <div className="year-selector">
            <label htmlFor="currentYear">Current Year</label>
            <select
              id="currentYear"
              name="currentYear"
              value={filters.currentYear}
              onChange={handleFilterChange}
              className="year-select"
            >
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2022-23">2022-23</option>
            </select>
          </div>
          <div className="year-selector">
            <label htmlFor="previousYear">Previous Year</label>
            <select
              id="previousYear"
              name="previousYear"
              value={filters.previousYear}
              onChange={handleFilterChange}
              className="year-select"
            >
              <option value="2023-24">2023-24</option>
              <option value="2022-23">2022-23</option>
              <option value="2021-22">2021-22</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <span>Loading comparison data...</span>
        </div>
      )}

      {comparisonData && !loading && (
        <div className="year-comparison-results">
          {renderOverallComparison()}
          {renderDepartmentComparison()}
          {renderBudgetHeadComparison()}
        </div>
      )}
    </div>
  );
};

export default YearComparison;
