import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Loader from './components/Loader.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import RippleCanvas from './components/RippleCanvas.jsx';
import GSAPProvider from './components/GSAPProvider.jsx';
import HomePage from './pages/HomePage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ScientistPage from './pages/ScientistPage.jsx';
import MapPage from './pages/MapPage.jsx';
import CoastGuardDashboard from './pages/CoastGuardDashboard.jsx';
import FishermanDashboard from './pages/FishermanDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import LoginPage from './pages/LoginPage.jsx';
import FloatingSOS from './components/FloatingSOS.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './index.css';
import './components.css';

/* Spin keyframe for Lucide Loader2 icon */
const spinStyle = document.createElement('style');
spinStyle.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
document.head.appendChild(spinStyle);

export default function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {/* Cinematic Boat Loader */}
      {!loaded && <Loader onDone={() => setLoaded(true)} />}

      {/* Full-page WebGL water ripple */}
      <RippleCanvas />

      <BrowserRouter>
        <AuthProvider>
          <div className="page-wrapper" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease', display: loaded ? 'block' : 'none' }}>
            <Navbar />
            <FloatingSOS />
            <GSAPProvider>
              <Routes>
                <Route path="/"          element={<HomePage />} />
                <Route path="/login"     element={<LoginPage />} />
                
                {/* Everyone logged in can access Chat and Map */}
                <Route path="/chat"      element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/map"       element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
                
                {/* Role Specific Routes */}
                <Route path="/scientist" element={<ProtectedRoute allowedRoles={['scientist', 'admin']}><ScientistPage /></ProtectedRoute>} />
                <Route path="/coastguard" element={<ProtectedRoute allowedRoles={['coastguard', 'admin']}><CoastGuardDashboard /></ProtectedRoute>} />
                <Route path="/fisherman" element={<ProtectedRoute allowedRoles={['fisherman', 'admin']}><FishermanDashboard /></ProtectedRoute>} />
                <Route path="/admin"     element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              </Routes>
            </GSAPProvider>
            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}
