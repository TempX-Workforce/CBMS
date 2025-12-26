import React from 'react';

/**
 * Reusable Button Component
 * 
 * @param {string} variant - primary | secondary | danger | success | warning
 * @param {string} size - sm | md | lg
 * @param {boolean} disabled - Whether button is disabled
 * @param {boolean} loading - Shows loading state
 * @param {React.ReactNode} icon - Icon component to display
 * @param {React.ReactNode} children - Button text/content
 * @param {function} onClick - Click handler
 * @param {string} type - button | submit | reset
 */
const Button = ({
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    children,
    onClick,
    type = 'button',
    className = '',
    ...props
}) => {
    const buttonClass = `btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`.trim();

    return (
        <button
            type={type}
            className={buttonClass}
            onClick={onClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <span className="btn-spinner"></span>}
            {!loading && icon && <span className="btn-icon">{icon}</span>}
            {children && <span className="btn-text">{children}</span>}
        </button>
    );
};

export default Button;
