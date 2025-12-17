import React from 'react';

const ContentCard = ({ title, subtitle, children, className = '' }) => {
  return (
    <div className={`chart-card ${className}`}>
      <div className="chart-header">
        <h3>{title}</h3>
        {subtitle && <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      <div className="chart-container" style={{ position: 'relative', height: '100%', minHeight: '300px' }}>
        {children}
      </div>
    </div>
  );
};

export default ContentCard;
