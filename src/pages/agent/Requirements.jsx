import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  MapPin,
  Eye,
  X,
  Edit2,
  Trash2,
  Grid3X3,
  Table,
  Building,
  Share2,
  Copy
} from 'lucide-react'

export default function AgentRequirements() {
  const { user } = useAuth()
  const [requirements, setRequirements] = useState([])
  const [filteredRequirements, setFilteredRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_to_me: false,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'

  useEffect(() => {
    fetchRequirements()
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

    if (filters.assigned_to_me) {
      filtered = filtered.filter(req => req.assigned_agent_id === user.id)
    }

    setFilteredRequirements(filtered)
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
      case 'urgent': return 'text-danger-600 bg-danger-100'
      case 'high': return 'text-warning-600 bg-warning-100'
      case 'medium': return 'text-warning-600 bg-warning-100'
      case 'low': return 'text-success-600 bg-success-100'
      default: return 'text-brown-light bg-cream'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-success-600 bg-success-100'
      case 'fulfilled': return 'text-success-600 bg-success-100'
      case 'closed': return 'text-brown-light bg-cream'
      default: return 'text-brown-light bg-cream'
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

  // Get requirements assigned to this agent
  const myRequirements = requirements.filter(req => req.assigned_agent_id === user.id)
  const unassignedRequirements = requirements.filter(req => !req.assigned_agent_id)

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brown">Property Requirements</h1>
              <p className="text-brown-light mt-2">View and manage customer property requirements</p>
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
              <Link
                to="/agent/requirements/add"
                className="btn-primary flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Add Requirement</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-cream-light rounded-lg shadow-sm p-6 border border-cream-dark">
            <div className="flex items-center">
              <div className="p-2 bg-cream rounded-lg">
                <Users className="w-6 h-6 text-brown" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-brown-light">My Requirements</p>
                <p className="text-2xl font-bold text-brown">{myRequirements.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-cream-light rounded-lg shadow-sm p-6 border border-cream-dark">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-brown-light">Active (Mine)</p>
                <p className="text-2xl font-bold text-brown">
                  {myRequirements.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-cream-light rounded-lg shadow-sm p-6 border border-cream-dark">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-brown-light">High Priority</p>
                <p className="text-2xl font-bold text-brown">
                  {myRequirements.filter(r => r.priority === 'high' || r.priority === 'urgent').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-cream-light rounded-lg shadow-sm p-6 border border-cream-dark">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-brown-light">Unassigned</p>
                <p className="text-2xl font-bold text-brown">{unassignedRequirements.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-cream-light rounded-lg shadow-sm border border-cream-dark p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-light w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, customer name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-field w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-cream-dark">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Statuses</option>
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
                    <option value="">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.assigned_to_me}
                      onChange={(e) => setFilters({ ...filters, assigned_to_me: e.target.checked })}
                      className="rounded border-cream-dark text-brown shadow-sm focus:border-brown focus:ring focus:ring-brown focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-brown">Only my requirements</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Requirements List */}
        <div className="bg-cream-light rounded-lg shadow-sm border border-cream-dark">
          {filteredRequirements.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-brown-light mx-auto mb-4" />
              <h3 className="text-lg font-medium text-brown mb-2">No requirements found</h3>
              <p className="text-brown-light">
                {requirements.length === 0 
                  ? "Get started by adding your first property requirement."
                  : "Try adjusting your search or filters."
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
              {filteredRequirements.map((requirement) => (
                <div key={requirement.id} className="border border-cream-dark rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-brown line-clamp-1">{requirement.title}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(requirement.status)}`}>
                      {getStatusIcon(requirement.status)}
                      <span className="ml-1 capitalize">{requirement.status}</span>
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

                  <div className="flex items-center text-xs sm:text-sm text-brown-light space-x-3 mb-3">
                    {requirement.property_type && (
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        <span>{requirement.property_type}</span>
                      </div>
                    )}
                    {requirement.bedrooms > 0 && (
                      <div className="flex items-center">
                        <i className="fas fa-bed mr-1"></i>
                        <span>{requirement.bedrooms} beds</span>
                      </div>
                    )}
                    {requirement.bathrooms > 0 && (
                      <div className="flex items-center">
                        <i className="fas fa-bath mr-1"></i>
                        <span>{requirement.bathrooms} baths</span>
                      </div>
                    )}
                    {requirement.area && (
                      <div className="flex items-center">
                        <i className="fas fa-ruler-combined mr-1"></i>
                        <span>{parseFloat(requirement.area) || requirement.area} sqft</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(requirement.priority)}`}>
                      {requirement.priority === 'urgent' && <Star className="w-3 h-3 mr-1" />}
                      <span className="capitalize">{requirement.priority}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-cream-dark">
                    <Link
                      to={`/agent/requirements/details/${requirement.id}`}
                      className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => shareOnWhatsApp(requirement)}
                      className="flex p-2 text-success-600 hover:text-success-700 hover:bg-success-50 rounded transition-colors"
                      title="Share on WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(requirement)}
                      className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded transition-colors"
                      title="Copy to Clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/agent/requirements/edit/${requirement.id}`}
                      className="flex p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-cream-dark">
                <thead className="bg-cream">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brown-light uppercase tracking-wider">
                      Requirement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brown-light uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brown-light uppercase tracking-wider">
                      Type & Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brown-light uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brown-light uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-brown-light uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-cream-light divide-y divide-cream-dark">
                  {filteredRequirements.map((requirement) => (
                    <tr key={requirement.id} className="hover:bg-cream">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-brown">
                          {requirement.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-brown">
                          {requirement.customer_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-brown">
                          <div className="font-medium">{requirement.property_type || 'N/A'}</div>
                          {requirement.price && (
                            <div className="text-brown-light">₹{requirement.price.toLocaleString('en-IN')}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(requirement.status)}`}>
                          {getStatusIcon(requirement.status)}
                          <span className="ml-1 capitalize">{requirement.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(requirement.priority)}`}>
                          {requirement.priority === 'urgent' ? <Star className="w-3 h-3 mr-1" /> : null}
                          <span className="capitalize">{requirement.priority}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/agent/requirements/details/${requirement.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Requirement"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => shareOnWhatsApp(requirement)}
                            className="text-green-600 hover:text-green-900"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(requirement)}
                            className="text-brown-light hover:text-brown"
                            title="Copy to Clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/agent/requirements/edit/${requirement.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Requirement"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
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

        {/* View Requirement Modal - DISABLED - Now using separate page */}
        {false && (
          <div className="fixed inset-0 bg-brown bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-cream-dark w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-cream-light">
              <div className="mt-3">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-brown">
                    Requirement Details
                  </h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-brown-light hover:text-brown"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="bg-cream p-4 rounded-lg">
                    <h4 className="font-semibold text-brown mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-brown-light">Title</label>
                        <p className="text-brown">{selectedRequirement.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-brown-light">Property Type</label>
                        <p className="text-brown">{selectedRequirement.property_type || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-brown-light">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequirement.status)}`}>
                          {getStatusIcon(selectedRequirement.status)}
                          <span className="ml-1 capitalize">{selectedRequirement.status}</span>
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-brown-light">Priority</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedRequirement.priority)}`}>
                          <span className="capitalize">{selectedRequirement.priority}</span>
                        </span>
                      </div>
                    </div>
                    {selectedRequirement.description && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-brown-light">Description</label>
                        <p className="text-gray-900 mt-1">{selectedRequirement.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-brown mb-3">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-brown-light">Name</label>
                        <p className="text-gray-900 flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {selectedRequirement.customer_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-brown-light">Phone</label>
                        <p className="text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {selectedRequirement.customer_phone}
                        </p>
                      </div>
                      {selectedRequirement.customer_email && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-brown-light">Email</label>
                          <p className="text-gray-900 flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {selectedRequirement.customer_email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-brown mb-3">Property Requirements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRequirement.price && (
                        <div>
                          <label className="text-sm font-medium text-brown-light">Price</label>
                          <p className="text-brown">₹{selectedRequirement.price.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      {selectedRequirement.bedrooms && (
                        <div>
                          <label className="text-sm font-medium text-brown-light">Bedrooms</label>
                          <p className="text-brown">{selectedRequirement.bedrooms}</p>
                        </div>
                      )}
                      {selectedRequirement.bathrooms && (
                        <div>
                          <label className="text-sm font-medium text-brown-light">Bathrooms</label>
                          <p className="text-brown">{selectedRequirement.bathrooms}</p>
                        </div>
                      )}
                      {selectedRequirement.area && (
                        <div>
                          <label className="text-sm font-medium text-brown-light">Area</label>
                          <p className="text-brown">{selectedRequirement.area} sq ft</p>
                        </div>
                      )}
                      {selectedRequirement.preferred_locations && selectedRequirement.preferred_locations.length > 0 && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-brown-light">Preferred Locations</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedRequirement.preferred_locations.map((location, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <MapPin className="w-3 h-3 mr-1" />
                                {location}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-brown mb-3">Additional Information</h4>
                    <div className="space-y-3">
                      {selectedRequirement.assigned_agent && (
                        <div>
                          <label className="text-sm font-medium text-brown-light">Assigned Agent</label>
                          <p className="text-brown">{selectedRequirement.assigned_agent.name}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-brown-light">Created</label>
                        <p className="text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(selectedRequirement.created_at).toLocaleString()}
                        </p>
                      </div>
                      {selectedRequirement.notes && (
                        <div>
                          <label className="text-sm font-medium text-brown-light">Notes</label>
                          <p className="text-gray-900 mt-1">{selectedRequirement.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  <Link
                    to={`/agent/requirements/edit/${selectedRequirement.id}`}
                    className="btn-primary"
                    onClick={() => setShowViewModal(false)}
                  >
                    Edit Requirement
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
