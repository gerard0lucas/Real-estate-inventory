import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)
  const { signIn, user, profile, resendConfirmationEmail } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/agent/dashboard')
      }
    }
  }, [user, profile, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setShowResendConfirmation(false)
    const { data, error } = await signIn(email, password)
    setLoading(false)
    
    if (error && error.message && error.message.includes('Email not confirmed')) {
      setShowResendConfirmation(true)
    }
    
    if (!error && data) {
      // Navigation will be handled by useEffect
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      return
    }
    await resendConfirmationEmail(email)
  }

  return (
    <div className="min-h-screen bg-cream-light flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center h-16 sm:h-20 w-auto mb-4 sm:mb-6">
            <img 
              src="https://magixland.in/images/magixland%20logo.jpg" 
              alt="Magixland Logo" 
              className="h-full w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brown">Magixland Dashboard</h1>
          <p className="text-brown-light mt-1 sm:mt-2 text-sm sm:text-base font-medium">Sign in to manage your properties</p>
        </div>

        <div className="mobile-form-section">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-brown mb-2 flex items-center">
                <i className="fas fa-envelope mr-2 text-brown-light"></i>
                Email Address
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-brown-light"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12 mobile-input"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brown mb-2 flex items-center">
                <i className="fas fa-lock mr-2 text-brown-light"></i>
                Password
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-brown-light"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 pr-12 mobile-input"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-brown-light hover:text-brown transition-colors p-1 touch-manipulation"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-brown focus:ring-brown border-brown-medium rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-brown-light">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm text-brown-light hover:text-brown font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mobile-btn"
            >
              <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sign-in-alt'} mr-2`}></i>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {showResendConfirmation && (
            <div className="mt-5 sm:mt-6 p-4 bg-warning-50 border border-warning-200 rounded-2xl">
              <div className="flex items-start">
                <i className="fas fa-exclamation-triangle text-warning-600 mr-3 mt-0.5"></i>
                <div>
                  <p className="text-sm text-warning-800 mb-2">
                    Your email hasn't been confirmed yet. Please check your inbox for the confirmation link.
                  </p>
                  <button
                    onClick={handleResendConfirmation}
                    className="text-sm text-brown-light hover:text-brown font-medium underline touch-manipulation flex items-center"
                  >
                    <i className="fas fa-paper-plane mr-1"></i>
                    Resend confirmation email
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 sm:mt-6 text-center">
            <p className="text-sm text-brown-light">
              Don't have an account?{' '}
              <Link to="/signup" className="text-brown hover:text-brown-dark font-medium flex items-center justify-center">
                <i className="fas fa-user-plus mr-1"></i>
                Sign up
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

