import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Reusable Alert Component
 * 
 * @param {string} variant - success | error | warning | info
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {boolean} dismissible - Can be dismissed
 * @param {function} onDismiss - Dismiss handler
 * @param {React.ReactNode} children - Custom content
 */
const Alert = ({
    variant = 'info',
    title,
    message,
    dismissible = false,
    onDismiss,
    children,
    className = ''
}) => {
    const icons = {
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        warning: <AlertTriangle size={20} />,
        info: <Info size={20} />
    };

    return (
        <div className={`alert alert-${variant} ${className}`.trim()}>
            <div className="alert-icon">{icons[variant]}</div>
            <div className="alert-content">
                {title && <div className="alert-title">{title}</div>}
                {message && <div className="alert-message">{message}</div>}
                {children}
            </div>
            {dismissible && (
                <button className="alert-dismiss" onClick={onDismiss} aria-label="Dismiss">
                    <X size={18} />
                </button>
            )}
        </div>
    );
};

export default Alert;
