import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Dashboard from './pages/Dashboard';
import CreditLedger from './pages/CreditLedger';
import OpenClawControl from './pages/OpenClawControl';
import BrowserControl from './pages/BrowserControl';
import CommandQueue from './pages/CommandQueue';
import BrowserSession from './pages/BrowserSession';
import BrowserSessionRecords from './pages/BrowserSessionRecords';
import ControlRoom from './pages/ControlRoom';
import VeridanKnowledgeVaultDashboard from './components/knowledge/VeridanKnowledgeVaultDashboard';
import CreditPublicSideDashboard from './components/credit/CreditPublicSideDashboard';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/credit-ledger" element={<CreditLedger />} />
      <Route path="/openclaw-control" element={<OpenClawControl />} />
      <Route path="/browser-control" element={<BrowserControl />} />
      <Route path="/command-queue" element={<CommandQueue />} />
      <Route path="/browser-session" element={<BrowserSession />} />
      <Route path="/browser-session-records" element={<BrowserSessionRecords />} />
      <Route path="/control-room" element={<ControlRoom />} />
      <Route path="/knowledge-vault" element={<VeridanKnowledgeVaultDashboard />} />
      <Route path="/credit-public-side" element={<CreditPublicSideDashboard />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App