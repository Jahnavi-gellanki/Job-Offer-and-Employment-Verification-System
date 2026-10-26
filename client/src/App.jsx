import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOffer from './pages/verify/VerifyOffer';
import VerifyEmployment from './pages/verify/VerifyEmployment';
import VerificationResult from './pages/verify/VerificationResult';

// Employer Pages
import EmployerDashboard from './pages/employer/EmployerDashboard';
import CompanySetup from './pages/employer/CompanySetup';
import CreateOffer from './pages/employer/CreateOffer';
import OfferDetails from './pages/employer/OfferDetails';

// Candidate Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CandidateOfferDetail from './pages/candidate/CandidateOfferDetail';

// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AuditHistory from './pages/admin/AuditHistory';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        <Navbar />

        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<VerifyOffer />} />
            <Route path="/verify/employment" element={<VerifyEmployment />} />
            <Route path="/verify/result/:offerId" element={<VerificationResult />} />

            {/* Employer Protected Routes */}
            <Route
              path="/employer/dashboard"
              element={
                <PrivateRoute allowedRoles={['employer', 'admin']}>
                  <EmployerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/employer/company-setup"
              element={
                <PrivateRoute allowedRoles={['employer', 'admin']}>
                  <CompanySetup />
                </PrivateRoute>
              }
            />
            <Route
              path="/employer/create-offer"
              element={
                <PrivateRoute allowedRoles={['employer', 'admin']}>
                  <CreateOffer />
                </PrivateRoute>
              }
            />
            <Route
              path="/employer/offer/:id"
              element={
                <PrivateRoute allowedRoles={['employer', 'admin']}>
                  <OfferDetails />
                </PrivateRoute>
              }
            />

            {/* Candidate Protected Routes */}
            <Route
              path="/candidate/dashboard"
              element={
                <PrivateRoute allowedRoles={['candidate', 'admin']}>
                  <CandidateDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/candidate/offer/:id"
              element={
                <PrivateRoute allowedRoles={['candidate', 'admin']}>
                  <CandidateOfferDetail />
                </PrivateRoute>
              }
            />

            {/* Recruiter Protected Routes */}
            <Route
              path="/recruiter/dashboard"
              element={
                <PrivateRoute allowedRoles={['recruiter', 'admin']}>
                  <RecruiterDashboard />
                </PrivateRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AuditHistory />
                </PrivateRoute>
              }
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
