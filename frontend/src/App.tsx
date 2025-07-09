import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { Layout } from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import PaymentMethods from './pages/PaymentMethods';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { Appointments } from './pages/Appointments';
import { ClinicalNotes } from './pages/ClinicalNotes';
import { PriorAuth } from './pages/PriorAuth';
import { TelehealthConcierge } from './pages/TelehealthConcierge';
import { RCMOptimizer } from './pages/RCMOptimizer';
import { MonitorCompliance } from './pages/MonitorCompliance';
import { IoTDataHub } from './pages/IoTDataHub';
import { Settings } from './pages/Settings';
import { HealthFlicks } from './pages/HealthFlicks';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <AuthProvider>
            <PaymentProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="patients" element={<Patients />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="clinical-notes" element={<ClinicalNotes />} />
                  <Route path="prior-auth" element={<PriorAuth />} />
                  <Route path="telehealth" element={<TelehealthConcierge />} />
                  <Route path="healthflicks" element={<HealthFlicks />} />
                  <Route path="rcm-optimizer" element={<RCMOptimizer />} />
                  <Route path="monitor-compliance" element={<MonitorCompliance />} />
                  <Route path="iot-data-hub" element={<IoTDataHub />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="subscription" element={<Subscription />} />
                  <Route path="payment-methods" element={<PaymentMethods />} />
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {/* Toast notifications */}
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                toastClassName="bg-gray-800 border border-gray-700"
              />
            </PaymentProvider>
          </AuthProvider>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;