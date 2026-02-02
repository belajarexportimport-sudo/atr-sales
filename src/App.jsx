import { useState } from 'react'
import './index.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InquiryFormPage from './pages/InquiryFormPage'
import LeadsPage from './pages/LeadsPage'
import TrackingPage from './pages/TrackingPage'
import OperationsPage from './pages/OperationsPage'
import DebugPage from './pages/DebugPage'
import Navigation from './components/Navigation'

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingInquiry, setEditingInquiry] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Safety Net: Wait for profile to load
  // Safety Net: Profile Missing (Trigger Failed)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            Your account exists, but your profile data is missing. This usually happens if the Sign-Up process was interrupted.
          </p>
          <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-500 mb-6 break-all">
            ID: {user.id}
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 w-full"
          >
            Sign Out & Try Registering Again
          </button>
        </div>
      </div>
    );
  }

  // Check if user is approved
  if (profile && !profile.approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your account has been created successfully, but it requires admin approval before you can access the system.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-sm text-blue-800 mt-2">
              Please contact your administrator to approve your account.
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Handle Create RFQ from Lead
  const handleCreateRFQFromLead = (lead) => {
    setSelectedLead(lead);
    setEditingInquiry(null);
    setCurrentPage('new-inquiry');
  };

  // Handle Edit Inquiry
  const handleEditInquiry = (inquiry) => {
    setEditingInquiry(inquiry);
    setSelectedLead(null);
    setCurrentPage('new-inquiry');
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onEditInquiry={handleEditInquiry} onNavigate={setCurrentPage} />;
      case 'debug':
        return <DebugPage />;
      case 'leads':
        return <LeadsPage onCreateRFQ={handleCreateRFQFromLead} />;
      case 'new-inquiry':
        return <InquiryFormPage
          lead={selectedLead}
          inquiry={editingInquiry}
          onSuccess={() => {
            setSelectedLead(null);
            setEditingInquiry(null);
            setCurrentPage('dashboard');
          }}
        />;
      case 'tracking':
        return <TrackingPage />;
      case 'ops':
        // Protected Route
        if (profile?.role !== 'admin') {
          return <DashboardPage />;
        }
        return <OperationsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

import { ToastProvider } from './contexts/ToastContext'
import { ModalProvider } from './contexts/ModalContext'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ModalProvider>
          <AppContent />
        </ModalProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
