import { useState } from 'react'
import './index.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InquiryFormPage from './pages/InquiryFormPage'
import LeadsPage from './pages/LeadsPage'
import TrackingPage from './pages/TrackingPage'
import OperationsPage from './pages/OperationsPage'
import Navigation from './components/Navigation'

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingInquiry, setEditingInquiry] = useState(null);

  if (loading) {
    // ... existing loading code ...
  }

  if (!user) {
    return <LoginPage />;
  }

  // Handle Create RFQ from Lead
  // ... existing handlers ...

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onEditInquiry={handleEditInquiry} />;
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
