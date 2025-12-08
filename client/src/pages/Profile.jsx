import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { LuUser, LuMail, LuBriefcase, LuBuilding2, LuCalendar, LuLock, LuSave, LuAlertCircle, LuCheckCircle2, LuEye, LuEyeOff } from 'react-icons/lu';
import './Profile.css';

const Profile = () => {
    const { user, updateProfile: updateAuthProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await authAPI.updateProfile(profileData);

            if (response.data.success) {
                // Update context with new user data
                await updateAuthProfile(response.data.data.user);

                // Update localStorage
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({
                    ...storedUser,
                    ...response.data.data.user
                }));

                setSuccess('Profile updated successfully!');
                setIsEditing(false);

                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validate passwords
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });

            if (response.data.success) {
                setSuccess('Password changed successfully!');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                setShowPasswordForm(false);
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const getRoleLabel = (role) => {
        const roleLabels = {
            admin: 'Administrator',
            office: 'Office Staff',
            department: 'Department User',
            hod: 'Head of Department',
            vice_principal: 'Vice Principal',
            principal: 'Principal',
            auditor: 'Auditor'
        };
        return roleLabels[role] || role;
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your account information and security settings</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    <LuAlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <LuCheckCircle2 size={20} />
                    <span>{success}</span>
                </div>
            )}

            <div className="profile-content">
                {/* Profile Information Card */}
                <div className="profile-card">
                    <div className="card-header">
                        <h2>Profile Information</h2>
                        {!isEditing && (
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <div className="profile-avatar">
                        <div className="avatar-circle">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="name">
                                <LuUser size={18} />
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={profileData.name}
                                onChange={handleProfileChange}
                                disabled={!isEditing}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                <LuMail size={18} />
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={profileData.email}
                                onChange={handleProfileChange}
                                disabled={!isEditing}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <LuBriefcase size={18} />
                                Role
                            </label>
                            <input
                                type="text"
                                value={getRoleLabel(user?.role)}
                                disabled
                                className="readonly-field"
                            />
                        </div>

                        {user?.department && (
                            <div className="form-group">
                                <label>
                                    <LuBuilding2 size={18} />
                                    Department
                                </label>
                                <input
                                    type="text"
                                    value={user.department.name || user.department}
                                    disabled
                                    className="readonly-field"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>
                                <LuCalendar size={18} />
                                Last Login
                            </label>
                            <input
                                type="text"
                                value={user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'N/A'}
                                disabled
                                className="readonly-field"
                            />
                        </div>

                        {isEditing && (
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setProfileData({
                                            name: user.name || '',
                                            email: user.email || '',
                                        });
                                    }}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    <LuSave size={18} />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Password Change Card */}
                <div className="profile-card">
                    <div className="card-header">
                        <h2>Security Settings</h2>
                    </div>

                    {!showPasswordForm ? (
                        <div className="password-prompt">
                            <LuLock size={48} className="lock-icon" />
                            <p>Keep your account secure by regularly updating your password</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowPasswordForm(true)}
                            >
                                <LuLock size={18} />
                                Change Password
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordSubmit} className="password-form">
                            <div className="form-group">
                                <label htmlFor="currentPassword">Current Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => togglePasswordVisibility('current')}
                                    >
                                        {showPasswords.current ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        id="newPassword"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => togglePasswordVisibility('new')}
                                    >
                                        {showPasswords.new ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                                    </button>
                                </div>
                                <small>Minimum 6 characters</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                    >
                                        {showPasswords.confirm ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowPasswordForm(false);
                                        setPasswordData({
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: '',
                                        });
                                    }}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    <LuLock size={18} />
                                    {loading ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
