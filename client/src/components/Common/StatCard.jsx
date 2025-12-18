import React from 'react';
import Tooltip from '../Tooltip/Tooltip';

const StatCard = ({ title, value, icon, trend, color, tooltipText }) => {
  // Determine trend color
  const getTrendClass = (trendValue) => {
    if (!trendValue) return '';
    return trendValue > 0 ? 'positive' : trendValue < 0 ? 'negative' : 'neutral';
  };

  const trendClass = typeof trend === 'number' ? getTrendClass(trend) : '';
  const trendDisplay = typeof trend === 'number' ? `${trend > 0 ? '+' : ''}${trend}%` : trend;

  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ backgroundColor: color || 'var(--primary)' }}>
        {icon}
      </div>
      <div className="metric-content">
        <Tooltip text={tooltipText || title} position="top">
          <h3>{value}</h3>
        </Tooltip>
        <p>{title}</p>
        {trend && (
           <span className={`metric-change ${trendClass}`} style={{ 
             color: trend > 0 ? 'var(--success)' : trend < 0 ? 'var(--error)' : 'var(--text-secondary)',
             fontSize: '0.9rem',
             fontWeight: '600'
           }}>
             {trendDisplay}
           </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
