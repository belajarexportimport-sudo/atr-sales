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
import MarketplacePage from './pages/MarketplacePage'
import Navigation from './components/Navigation'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import UpdatePasswordPage from './pages/UpdatePasswordPage'
import QuotationPage from './pages/QuotationPage'

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingInquiry, setEditingInquiry] = useState(null);
  const [quotationInquiry, setQuotationInquiry] = useState(null);

  // Handle URL-based routing for Password Reset (Supabase Redirect)
  // When Supabase redirects back, it might include hash fragments.
  // We can check window.location.pathname if we were using a real router like react-router-dom
  // BUT this app seems to use state-based routing 'currentPage'
  // However, Supabase auth redirects are full page reloads usually unless handled.

  // WAIT: This app is using state-based routing (setCurrentPage) but relies on `window.location.pathname`? 
  // Checking the file, it seems purely state-based `currentPage`.
  // If `UpdatePasswordPage` is reached via a URL link from email, we need to handle that.

  // Let's modify the initial state of currentPage to check URL path
  useState(() => {
    const path = window.location.pathname;
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/update-password') return 'update-password';
    return 'dashboard';
  });

  // Actually, since I can't easily change the useState initialization in a replace_file_content safely without context of imports,
  // I will check if I can wrap the whole App in BrowserRouter or just hack the current routing.
  // The current app does `const [currentPage, setCurrentPage] = useState('dashboard');`

  // Seeing as `App.jsx` imports `Link` in `ForgotPasswordPage`, the user might expect `react-router-dom`. 
  // But `App.jsx` itself does NOT seem to use `react-router-dom`'s `<Routes>`.
  // It uses a switch statement `renderPage`.

  // Let's look at `App.jsx` again.
  // It has `import { useState } from 'react'` but NO `react-router-dom` in the imports shown in previous `view_file`.
  // Wait, `ForgotPasswordPage` I wrote uses `import { Link } from 'react-router-dom';`. THIS WILL CRASH if not inside a Router.

  // I need to fix `ForgotPasswordPage` to use a simple <a> tag or a prop callback if `react-router-dom` is not installed/used.
  // AND I need to handle the "routing" for the reset password link which comes from an external email.

  // Strategy:
  // 1. Check if `react-router-dom` is in `package.json`.
  // 2. If yes, Refactor App to use it? Or just stick to state routing + URL check.
  // 3. The `resetPasswordForEmail` redirect URL will be a full page load.
  //    So when the user lands on `.../update-password`, we need to detect that.

  // Let's check `package.json` first to see if `react-router-dom` exists.


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
    if (currentPage === 'forgot-password') {
      return <ForgotPasswordPage />;
    }
    if (currentPage === 'update-password') {
      // Ideally this shouldn't happen for update-password as they should be logged in via link
      // checking this just in case
      return <UpdatePasswordPage />;
    }
    return <LoginPage />;
  }

  // Allow Update Password page even if profile is problematic?
  // Maybe not, keep it simple.

  // Safety Net: Wait for profile to load
  // Safety Net: Profile Missing (Trigger Failed)
  if (!profile) {
    if (currentPage === 'update-password') return <UpdatePasswordPage />; // ALLOW PASSWORD UPDATE even if profile missing logic failing

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          {/* ... */}
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

  // Handle Quotation View
  const handleViewQuotation = (inquiry) => {
    setQuotationInquiry(inquiry);
    setCurrentPage('quotation');
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onEditInquiry={handleEditInquiry} onQuote={handleViewQuotation} onNavigate={setCurrentPage} />;
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
          onQuote={handleViewQuotation}
        />;
      case 'tracking':
        return <TrackingPage />;
      case 'ops':
        // Protected Route
        if (profile?.role !== 'admin') {
          return <DashboardPage />;
        }
        return <OperationsPage />;
      case 'forgot-password':
        return <ForgotPasswordPage />;
      case 'update-password':
        return <UpdatePasswordPage />;
      case 'quotation':
        return (
          <QuotationPage
            inquiry={quotationInquiry}
            salesRep={profile}
            onBack={() => setCurrentPage('dashboard')}
          />
        );
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
