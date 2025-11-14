import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { 
  Users, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Plus, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Eye,
  Grid3X3,
  Table,
  Building,
  Share2,
  Copy
} from 'lucide-react'

export default function AdminRequirements() {
  const [requirements, setRequirements] = useState([])
  const [filteredRequirements, setFilteredRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_agent: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'

  useEffect(() => {
    fetchRequirements()
    fetchAgents()
  }, [])

  useEffect(() => {
    filterRequirements()
  }, [requirements, searchTerm, filters])

  const fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('property_requirements')
        .select(`
          *,
          assigned_agent:assigned_agent_id(id, name, email),
          creator:created_by(id, name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequirements(data || [])
    } catch (error) {
      console.error('Error fetching requirements:', error)
      toast.error('Failed to load requirements')
    } finally {
      setLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'agent')
        .order('name')

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const filterRequirements = () => {
    let filtered = requirements

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.customer_phone.includes(searchTerm) ||
        (req.customer_email && req.customer_email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filters.status) {
      filtered = filtered.filter(req => req.status === filters.status)
    }

    if (filters.priority) {
      filtered = filtered.filter(req => req.priority === filters.priority)
    }

    if (filters.assigned_agent) {
      filtered = filtered.filter(req => req.assigned_agent_id === filters.assigned_agent)
    }

    setFilteredRequirements(filtered)
  }

  const handleAssignAgent = async (requirementId, agentId) => {
    try {
      const { error } = await supabase
        .from('property_requirements')
        .update({ assigned_agent_id: agentId })
        .eq('id', requirementId)

      if (error) throw error

      toast.success('Agent assigned successfully')
      fetchRequirements()
    } catch (error) {
      console.error('Error assigning agent:', error)
      toast.error('Failed to assign agent')
    }
  }

  const handleUpdateStatus = async (requirementId, newStatus) => {
    try {
      const { error } = await supabase
        .from('property_requirements')
        .update({ status: newStatus })
        .eq('id', requirementId)

      if (error) throw error

      toast.success('Status updated successfully')
      fetchRequirements()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleDeleteRequirement = async (requirementId) => {
    if (!confirm('Are you sure you want to delete this requirement?')) return

    try {
      const { error } = await supabase
        .from('property_requirements')
        .delete()
        .eq('id', requirementId)

      if (error) throw error

      toast.success('Requirement deleted successfully')
      fetchRequirements()
    } catch (error) {
      console.error('Error deleting requirement:', error)
      toast.error('Failed to delete requirement')
    }
  }

  // Share Functions
  const generateWhatsAppMessage = (requirement) => {
    const message = `📋 *${requirement.title}*

👤 *Customer:* ${requirement.customer_name || 'N/A'}
📞 *Phone:* ${requirement.customer_phone || 'N/A'}
${requirement.customer_email ? `📧 *Email:* ${requirement.customer_email}` : ''}

🏡 *Property Type:* ${requirement.property_type || 'N/A'}
💰 *Budget:* ${requirement.price ? `₹${requirement.price.toLocaleString('en-IN')}` : 'Not specified'}
🛏️ *Bedrooms:* ${requirement.bedrooms || 'Not specified'}
🚿 *Bathrooms:* ${requirement.bathrooms || 'Not specified'}
📐 *Area:* ${requirement.area ? `${parseFloat(requirement.area) || requirement.area} sqft` : 'Not specified'}

📍 *Preferred Locations:*
${requirement.preferred_locations && requirement.preferred_locations.length > 0 
  ? requirement.preferred_locations.map(loc => `  • ${loc}`).join('\n')
  : 'Not specified'}

🚨 *Priority:* ${requirement.priority?.charAt(0).toUpperCase() + requirement.priority?.slice(1) || 'N/A'}
📊 *Status:* ${requirement.status?.charAt(0).toUpperCase() + requirement.status?.slice(1) || 'N/A'}

${requirement.description ? `📝 *Description:*\n${requirement.description}` : ''}

${requirement.notes ? `📌 *Notes:*\n${requirement.notes}` : ''}

${requirement.assigned_agent ? `👨‍💼 *Assigned Agent:* ${requirement.assigned_agent.name}` : ''}

🏢 *Magixland Real Estate*
#PropertyRequirement #RealEstate #Magixland`

    return encodeURIComponent(message)
  }

  const shareOnWhatsApp = (requirement) => {
    const message = generateWhatsAppMessage(requirement)
    const whatsappUrl = `https://wa.me/?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const generateClipboardText = (requirement) => {
    return `📋 ${requirement.title}

👤 Customer: ${requirement.customer_name || 'N/A'}
📞 Phone: ${requirement.customer_phone || 'N/A'}
${requirement.customer_email ? `📧 Email: ${requirement.customer_email}` : ''}

🏡 Property Type: ${requirement.property_type || 'N/A'}
💰 Budget: ${requirement.price ? `₹${requirement.price.toLocaleString('en-IN')}` : 'Not specified'}
🛏️ Bedrooms: ${requirement.bedrooms || 'Not specified'}
🚿 Bathrooms: ${requirement.bathrooms || 'Not specified'}
📐 Area: ${requirement.area ? `${parseFloat(requirement.area) || requirement.area} sqft` : 'Not specified'}

📍 Preferred Locations:
${requirement.preferred_locations && requirement.preferred_locations.length > 0 
  ? requirement.preferred_locations.map(loc => `  • ${loc}`).join('\n')
  : 'Not specified'}

🚨 Priority: ${requirement.priority?.charAt(0).toUpperCase() + requirement.priority?.slice(1) || 'N/A'}
📊 Status: ${requirement.status?.charAt(0).toUpperCase() + requirement.status?.slice(1) || 'N/A'}

${requirement.description ? `📝 Description:\n${requirement.description}` : ''}

${requirement.notes ? `📌 Notes:\n${requirement.notes}` : ''}

${requirement.assigned_agent ? `👨‍💼 Assigned Agent: ${requirement.assigned_agent.name}` : ''}

🏢 Magixland Real Estate`
  }

  const copyToClipboard = async (requirement) => {
    try {
      const text = generateClipboardText(requirement)
      await navigator.clipboard.writeText(text)
      toast.success('Requirement details copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  // Helper Functions
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100'
      case 'fulfilled': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />
      case 'fulfilled': return <CheckCircle className="w-4 h-4" />
      case 'closed': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-brown">Magixland Requirements</h1>
            <p className="text-brown-light mt-1 sm:mt-2 text-sm sm:text-base">Manage customer property requirements</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Grid/Table Toggle */}
            <div className="flex items-center border border-cream-dark rounded-lg overflow-hidden bg-cream-light">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-cream text-brown border-r border-cream-dark'
                    : 'bg-cream-light text-brown-light hover:bg-cream'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="text-sm font-medium">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-cream text-brown border-l border-cream-dark'
                    : 'bg-cream-light text-brown-light hover:bg-cream'
                }`}
              >
                <Table className="w-4 h-4" />
                <span className="text-sm font-medium">Table</span>
              </button>
            </div>
            <Link to="/admin/requirements/add" className="btn-primary flex items-center justify-center sm:justify-start">
              <Plus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Add Requirement</span>
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="card mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brown-light" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search requirements..."
                className="input-field pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center justify-center"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-cream-dark grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-brown mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input-field"
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-2">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="input-field"
                >
                  <option value="">All</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-2">Assigned Agent</label>
                <select
                  value={filters.assigned_agent}
                  onChange={(e) => setFilters({ ...filters, assigned_agent: e.target.value })}
                  className="input-field"
                >
                  <option value="">All</option>
                  <option value="unassigned">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-brown-light">
          Showing {filteredRequirements.length} of {requirements.length} requirements
        </div>

        {/* Requirements Display */}
        {filteredRequirements.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="w-12 h-12 text-brown-light mx-auto mb-4" />
            <p className="text-brown-light">No requirements found</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredRequirements.map((requirement) => (
                <div key={requirement.id} className="card-elevated">
                  {/* Details */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-brown line-clamp-1 flex-1 mr-2">
                        {requirement.title}
                      </h3>
                      <span
                        className={`badge ${
                          requirement.status === 'active'
                            ? 'badge-success'
                            : requirement.status === 'fulfilled'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {requirement.status}
                      </span>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-brown-light mb-3 line-clamp-1">
                      {requirement.customer_name}
                    </p>
                    
                    {requirement.price && (
                      <p className="text-lg sm:text-xl font-semibold text-brown mb-3">
                        ₹{requirement.price.toLocaleString('en-IN')}
                      </p>
                    )}
                    
                    {/* Property specs with icons */}
                    <div className="flex items-center text-xs sm:text-sm text-brown-light space-x-3 sm:space-x-4">
                      {requirement.property_type && (
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          <span>{requirement.property_type}</span>
                        </div>
                      )}
                      {requirement.bedrooms > 0 && (
                        <div className="flex items-center">
                          <i className="fas fa-bed mr-1 text-brown-light"></i>
                          <span>{requirement.bedrooms} beds</span>
                        </div>
                      )}
                      {requirement.bathrooms > 0 && (
                        <div className="flex items-center">
                          <i className="fas fa-bath mr-1 text-brown-light"></i>
                          <span>{requirement.bathrooms} baths</span>
                        </div>
                      )}
                      {requirement.area && (
                        <div className="flex items-center">
                          <i className="fas fa-ruler-combined mr-1 text-brown-light"></i>
                          <span>{parseFloat(requirement.area) || requirement.area} sqft</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(requirement.priority)}`}>
                        {requirement.priority === 'urgent' && <Star className="w-3 h-3 mr-1" />}
                        <span className="capitalize">{requirement.priority}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-cream-dark">
                    <div className="flex items-center justify-between">
                      {/* Primary Actions - Icon buttons */}
                      <div className="flex items-center space-x-1">
                        <Link
                          to={`/admin/requirements/details/${requirement.id}`}
                          className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => shareOnWhatsApp(requirement)}
                          className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(requirement)}
                          className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                          title="Copy details"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/admin/requirements/edit/${requirement.id}`}
                          className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteRequirement(requirement.id)}
                          className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          /* Table View */
          <div className="card overflow-x-auto">
            <table className="w-full">
                <thead>
                  <tr className="border-b border-cream-dark">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Requirement</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Type & Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Priority</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-brown">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequirements.map((requirement) => (
                    <tr key={requirement.id} className="border-b border-cream-dark hover:bg-cream transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-brown">{requirement.title}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-brown-light">{requirement.customer_name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-brown-light">
                          <div className="font-semibold text-brown">{requirement.property_type || 'N/A'}</div>
                          {requirement.price && (
                            <div>₹{requirement.price.toLocaleString('en-IN')}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`badge ${
                            requirement.status === 'active'
                              ? 'badge-success'
                              : requirement.status === 'fulfilled'
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                        >
                          {requirement.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center text-xs px-2 py-1 rounded ${getPriorityColor(requirement.priority)}`}>
                          {requirement.priority === 'urgent' && <Star className="w-3 h-3 mr-1" />}
                          <span className="capitalize">{requirement.priority}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            to={`/admin/requirements/details/${requirement.id}`}
                            className="p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                            title="Edit requirement"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => shareOnWhatsApp(requirement)}
                            className="p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                            title="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(requirement)}
                            className="p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/admin/requirements/edit/${requirement.id}`}
                            className="p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteRequirement(requirement.id)}
                            className="p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                            title="Delete"
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
          )
        }
      </div>
    </Layout>
  )
}
