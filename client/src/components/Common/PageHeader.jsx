import React from 'react';
import { RefreshCw } from 'lucide-react';
import '../../pages/GraphicalDashboard.css'; // Import the CSS where the glass styles are defined, or rely on global index.css if moved there. 
// For now, assuming index.css has the vars, but the specific classes like .dashboard-header might need to be global or scoped here.
// Let's use inline styles or a new CSS file for Common components to be cleaner.
// Actually, let's assume we will move the styles to global or a Common.css.
// For now, I'll use the classes that are likely to be in index.css or GraphicalDashboard.css which I'll ensure are available.

const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="dashboard-header" style={{ marginBottom: '1.5rem', marginTop: '0', padding: '1.5rem' }}>
      <div className="header-content">
        <h1 style={{ fontSize: '1.75rem' }}>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-controls">
        {children}
      </div>
    </div>
  );
};

export default PageHeader;
