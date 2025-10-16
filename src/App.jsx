import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Auth Pages
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import ManageAgents from './pages/admin/ManageAgents'
import AdminProjects from './pages/admin/Projects'
import AdminProperties from './pages/admin/Properties'
import AdminAddProperty from './pages/admin/AddProperty'
import AdminEditProperty from './pages/admin/EditProperty'
import AdminPropertyDetails from './pages/admin/PropertyDetails'

// Agent Pages
import AgentDashboard from './pages/agent/Dashboard'
import AgentProperties from './pages/agent/Properties'
import AddProperty from './pages/agent/AddProperty'
import EditProperty from './pages/agent/EditProperty'
import AgentPropertyDetails from './pages/agent/PropertyDetails'

// Common Pages
import Unauthorized from './pages/Unauthorized'
import NotFound from './pages/NotFound'

function App() {
  const HashRecoveryRedirect = () => {
    const navigate = useNavigate()
    const location = useLocation()
    
    // Redirect to /reset-password when arriving via Supabase recovery link
    // Example: https://site/#access_token=...&type=recovery
    useEffect(() => {
      const hash = window.location.hash || ''
      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const isRecovery = params.get('type') === 'recovery'
      if (isRecovery && location.pathname !== '/reset-password') {
        navigate('/reset-password', { replace: true })
      }
    }, [location.pathname, navigate])
    return null
  }

  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <HashRecoveryRedirect />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/agents"
            element={
              <ProtectedRoute requiredRole="admin">
                <ManageAgents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/properties"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProperties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/properties/add"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminAddProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/properties/edit/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminEditProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/properties/details/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPropertyDetails />
              </ProtectedRoute>
            }
          />
          
          {/* Agent Routes */}
          <Route
            path="/agent/dashboard"
            element={
              <ProtectedRoute requiredRole="agent">
                <AgentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/properties"
            element={
              <ProtectedRoute requiredRole="agent">
                <AgentProperties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/properties/add"
            element={
              <ProtectedRoute requiredRole="agent">
                <AddProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/properties/edit/:id"
            element={
              <ProtectedRoute requiredRole="agent">
                <EditProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/properties/copy/:id"
            element={
              <ProtectedRoute requiredRole="agent">
                <AddProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/properties/details/:id"
            element={
              <ProtectedRoute requiredRole="agent">
                <AgentPropertyDetails />
              </ProtectedRoute>
            }
          />
          
          {/* Common Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App

