import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { Users, Trash2, Mail, Calendar, Edit2, X, Plus, Eye, EyeOff, Key } from 'lucide-react'

export default function ManageAgents() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingAgent, setEditingAgent] = useState(null)
  const [editName, setEditName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
      toast.error('Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAgent = async (agentId) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return
    }

    try {
      // Note: This will only delete the profile. The auth user will remain.
      // In production, you'd want to use Supabase Admin API to delete the auth user
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', agentId)

      if (error) throw error
      toast.success('Agent deleted successfully')
      fetchAgents()
    } catch (error) {
      console.error('Error deleting agent:', error)
      toast.error('Failed to delete agent')
    }
  }

  const handleEditAgent = (agent) => {
    setEditingAgent(agent)
    setEditName(agent.name)
    setNewPassword('')
    setShowEditPassword(false)
  }

  const handleUpdateAgent = async (e) => {
    e.preventDefault()
    
    try {
      // Update profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: editName })
        .eq('id', editingAgent.id)

      if (profileError) throw profileError

      // Update password if provided
      if (newPassword && newPassword.length >= 6) {
        await updateAgentPassword(editingAgent.id, newPassword)
      } else {
        toast.success('Agent profile updated successfully')
      }

      setEditingAgent(null)
      setNewPassword('')
      fetchAgents()
    } catch (error) {
      console.error('Error updating agent:', error)
      toast.error('Failed to update agent')
    }
  }

  const updateAgentPassword = async (userId, newPassword) => {
    try {
      // Call Supabase function to update password
      // This uses a custom database function or Edge Function
      const { data, error } = await supabase.rpc('admin_update_user_password', {
        user_id: userId,
        new_password: newPassword
      })

      if (error) {
        // If the function doesn't exist, show a helpful error
        if (error.message.includes('function') || error.code === '42883') {
          toast.error('Password update function not configured. Please set up the admin function.')
          console.error('To enable password updates, create the admin_update_user_password function in Supabase.')
          return
        }
        throw error
      }

      toast.success('Agent profile and password updated successfully')
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Failed to update password')
    }
  }

  const handleResetPassword = async (agent) => {
    if (!confirm(`Send password reset email to ${agent.email}?`)) {
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(agent.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      toast.success(`Password reset email sent to ${agent.email}`)
    } catch (error) {
      console.error('Error sending reset email:', error)
      toast.error('Failed to send password reset email')
    }
  }

  const handleAddAgent = async (e) => {
    e.preventDefault()
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAgent.email,
        password: newAgent.password,
        options: {
          data: {
            name: newAgent.name,
            role: 'agent'
          }
        }
      })

      if (authError) throw authError

      toast.success('Agent added successfully!')
      setShowAddModal(false)
      setNewAgent({ name: '', email: '', password: '' })
      fetchAgents()
    } catch (error) {
      console.error('Error adding agent:', error)
      toast.error(error.message || 'Failed to add agent')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Agents</h1>
            <p className="text-gray-600 mt-2">Add, edit, and delete agent accounts</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Agent
          </button>
        </div>

        <div className="card">
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No agents yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary mt-4"
              >
                <Plus className="w-5 h-5 mr-2 inline" />
                Add Your First Agent
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Joined</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-primary-600 font-semibold">
                              {agent.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{agent.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {agent.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(agent.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditAgent(agent)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit agent"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(agent)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Reset password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(agent.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete agent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Agent Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add New Agent</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewAgent({ name: '', email: '', password: '' })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddAgent}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="input-field"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newAgent.email}
                    onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                    className="input-field"
                    placeholder="agent@example.com"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newAgent.password}
                      onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                      className="input-field pr-10"
                      placeholder="••••••••"
                      minLength="6"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    Add Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setNewAgent({ name: '', email: '', password: '' })
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Agent Modal */}
        {editingAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Edit Agent</h2>
                <button
                  onClick={() => {
                    setEditingAgent(null)
                    setNewPassword('')
                    setShowEditPassword(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleUpdateAgent}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingAgent.email}
                    className="input-field bg-gray-100"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field pr-10"
                      placeholder="Leave blank to keep current password"
                      minLength="6"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showEditPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {newPassword ? 'Minimum 6 characters - Password will be updated immediately' : 'Leave blank to keep current password'}
                  </p>
                </div>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Key className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Alternative: Email Reset</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Click the key icon in the agents list to send a password reset email instead
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAgent(null)
                      setNewPassword('')
                      setShowEditPassword(false)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

