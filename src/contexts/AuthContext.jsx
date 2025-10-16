import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const appBaseUrl = import.meta.env.VITE_SITE_URL || window.location.origin

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })
      if (error) throw error
      toast.success('Account created successfully! Please check your email.')
      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        // Handle email not confirmed error specifically
        if (error.message.includes('Email not confirmed')) {
          toast.error('Please confirm your email before signing in. Check your inbox for the confirmation link.')
        } else {
          toast.error(error.message)
        }
        throw error
      }
      toast.success('Signed in successfully!')
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully!')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appBaseUrl}/reset-password`,
      })
      if (error) throw error
      toast.success('Password reset email sent!')
      return { error: null }
    } catch (error) {
      toast.error(error.message)
      return { error }
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      toast.success('Password updated successfully!')
      return { error: null }
    } catch (error) {
      toast.error(error.message)
      return { error }
    }
  }

  const resendConfirmationEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })
      if (error) throw error
      toast.success('Confirmation email sent! Please check your inbox.')
      return { error: null }
    } catch (error) {
      toast.error(error.message)
      return { error }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    resendConfirmationEmail,
    isAdmin: profile?.role === 'admin',
    isAgent: profile?.role === 'agent',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

