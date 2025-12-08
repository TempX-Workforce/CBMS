import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SubmitExpenditure from './pages/SubmitExpenditure';
import BudgetAllocations from './pages/BudgetAllocations';
import ApprovalsQueue from './pages/ApprovalsQueue';
import Reports from './pages/Reports';
import Departments from './pages/Departments';
import Users from './pages/Users';
import DepartmentUsers from './pages/DepartmentUsers';
import DepartmentDashboard from './pages/DepartmentDashboard';
import ConsolidatedDashboard from './pages/ConsolidatedDashboard';
import BudgetHeads from './pages/BudgetHeads';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Notifications from './pages/Notifications';
import YearComparison from './pages/YearComparison';
import ResubmitExpenditure from './pages/ResubmitExpenditure';
import BulkUpload from './pages/BulkUpload';
import HODDashboard from './pages/HODDashboard';
import GraphicalDashboard from './pages/GraphicalDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Admin Routes */}
              <Route path="users" element={<Users />} />
              <Route path="departments" element={<Departments />} />
              <Route path="budget-heads" element={<BudgetHeads />} />
              <Route path="settings" element={<Settings />} />
              
              {/* Office Routes */}
              <Route path="allocations" element={<BudgetAllocations />} />
              <Route path="bulk-upload" element={<BulkUpload />} />
              <Route path="approvals" element={<ApprovalsQueue />} />
              <Route path="reports" element={<Reports />} />
              
              {/* Department Routes */}
              <Route path="expenditures" element={<DepartmentDashboard />} />
              <Route path="submit-expenditure" element={<SubmitExpenditure />} />
              <Route path="resubmit-expenditure/:id" element={<ResubmitExpenditure />} />
              
              {/* HOD Routes */}
              <Route path="department-expenditures" element={<HODDashboard />} />
              <Route path="department-users" element={<DepartmentUsers />} />
              
              {/* Management Routes */}
              <Route path="consolidated-view" element={<ConsolidatedDashboard />} />
              <Route path="year-comparison" element={<YearComparison />} />
              
              {/* Auditor Routes */}
              <Route path="audit-logs" element={<AuditLogs />} />
              
              {/* Common Routes */}
              <Route path="notifications" element={<Notifications />} />
              <Route path="graphical-dashboard" element={<GraphicalDashboard />} />
              <Route path="profile" element={<div>Profile (Coming Soon)</div>} />
              <Route path="change-password" element={<div>Change Password (Coming Soon)</div>} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
