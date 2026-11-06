import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import QueueControlPage from './pages/QueueControlPage.jsx';
import JoinQueuePage from './pages/JoinQueuePage.jsx';
import StatusPage from './pages/StatusPage.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import ShopDetailPage from './pages/ShopDetailPage.jsx';
import ScanPage from './pages/ScanPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Customer Self-Service Routes (Mobile-first) */}
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/browse/:shopId" element={<ShopDetailPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/q/:slug" element={<JoinQueuePage />} />
          <Route path="/status/:entryKey" element={<StatusPage />} />

          {/* Protected Merchant Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/queues/:queueId"
            element={
              <ProtectedRoute>
                <QueueControlPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
