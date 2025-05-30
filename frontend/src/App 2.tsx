import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
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

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="clinical-notes" element={<ClinicalNotes />} />
          <Route path="prior-auth" element={<PriorAuth />} />
          <Route path="telehealth" element={<TelehealthConcierge />} />
          <Route path="rcm-optimizer" element={<RCMOptimizer />} />
          <Route path="monitor-compliance" element={<MonitorCompliance />} />
          <Route path="iot-data-hub" element={<IoTDataHub />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;