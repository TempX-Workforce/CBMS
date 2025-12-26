import React from 'react';

/**
 * Reusable Status Badge Component
 * 
 * @param {string} status - Status value (lowercase with underscores)
 * @param {string} label - Display label (optional, defaults to formatted status)
 * @param {string} variant - Color variant override
 */
const StatusBadge = ({ status, label, variant, className = '' }) => {
    const getVariantClass = () => {
        if (variant) return `status-${variant}`;

        // Map common status patterns to variants
        const statusMap = {
            // Expenditure statuses
            'pending': 'warning',
            'verified': 'info',
            'approved': 'success',
            'rejected': 'danger',
            'finalized': 'success',

            // Proposal statuses
            'draft': 'secondary',
            'submitted': 'info',

            // Income statuses
            'expected': 'info',
            'received': 'warning',

            // Financial Year statuses
            'planning': 'info',
            'active': 'success',
            'locked': 'warning',
            'closed': 'danger',

            // Allocation statuses
            'active': 'success',
            'amended': 'warning',
            'superseded': 'secondary'
        };

        return `status-${statusMap[status] || 'secondary'}`;
    };

    const formatLabel = () => {
        if (label) return label;

        // Convert snake_case to Title Case
        return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <span className={`status-badge ${getVariantClass()} ${className}`.trim()}>
            {formatLabel()}
        </span>
    );
};

export default StatusBadge;
