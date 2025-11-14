import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { Home, Plus, Edit2, Trash2, Copy, Search, Share2, Eye, X, MapPin, Phone, User, Building, Calendar, ExternalLink, Grid3X3, Table } from 'lucide-react'

export default function AgentProperties() {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'

  const generateWhatsAppMessage = (property) => {
    const message = `🏠 *${property.title}*

🔢 *Property Code:* ${property.property_code || 'N/A'}
💰 *Price:* ₹${property.price?.toLocaleString('en-IN') || 'N/A'}
📍 *Location:* ${property.project?.name || 'N/A'}${property.project?.location ? `, ${property.project.location}` : ''}
🏡 *Type:* ${property.type || 'N/A'}
🛏️ *Bedrooms:* ${property.bedrooms || 'N/A'}
🚿 *Bathrooms:* ${property.bathrooms || 'N/A'}
📐 *Area:* ${property.area ? `${parseFloat(property.area) || property.area} sqft` : 'N/A'}
👨‍💼 *Agent:* ${property.agent?.name || 'N/A'}
📧 *Contact:* ${property.agent?.email || 'N/A'}

${property.description ? `📝 *Description:*\n${property.description}` : ''}

${property.address ? `📍 *Address:*\n${property.address}` : ''}

${property.location_url ? `🌐 *Location URL:*\n${property.location_url}` : ''}

${property.owner_details?.name ? `👤 *Owner:* ${property.owner_details.name}\n📞 *Owner Phone:* ${property.owner_details.phone || 'N/A'}` : ''}

${property.broker_details?.name ? `🏢 *Broker:* ${property.broker_details.name}\n📞 *Broker Phone:* ${property.broker_details.phone || 'N/A'}` : ''}

${property.price_per_sqft ? `💰 *Price per Sq Ft:* ₹${property.price_per_sqft.toLocaleString('en-IN')}` : ''}

Status: ${property.status?.charAt(0).toUpperCase() + property.status?.slice(1)}

🏢 *Magixland Real Estate*
#PropertyForSale #RealEstate #Magixland`

    return encodeURIComponent(message)
  }

  const shareOnWhatsApp = (property) => {
    const message = generateWhatsAppMessage(property)
    const whatsappUrl = `https://wa.me/?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const generateClipboardText = (property) => {
    return `🏠 ${property.title}

🔢 Property Code: ${property.property_code || 'N/A'}
💰 Price: ₹${property.price?.toLocaleString('en-IN') || 'N/A'}
📍 Location: ${property.project?.name || 'N/A'}${property.project?.location ? `, ${property.project.location}` : ''}
🏡 Type: ${property.type || 'N/A'}
🛏️ Bedrooms: ${property.bedrooms || 'N/A'}
🚿 Bathrooms: ${property.bathrooms || 'N/A'}
📐 Area: ${property.area ? `${parseFloat(property.area) || property.area} sqft` : 'N/A'}
👨‍💼 Agent: ${property.agent?.name || 'N/A'}
📧 Contact: ${property.agent?.email || 'N/A'}

${property.description ? `📝 Description:\n${property.description}` : ''}

${property.address ? `📍 Address:\n${property.address}` : ''}

${property.location_url ? `🌐 Location URL:\n${property.location_url}` : ''}

${property.owner_details?.name ? `👤 Owner: ${property.owner_details.name}\n📞 Owner Phone: ${property.owner_details.phone || 'N/A'}` : ''}

${property.broker_details?.name ? `🏢 Broker: ${property.broker_details.name}\n📞 Broker Phone: ${property.broker_details.phone || 'N/A'}` : ''}

${property.price_per_sqft ? `💰 Price per Sq Ft: ₹${property.price_per_sqft.toLocaleString('en-IN')}` : ''}

Status: ${property.status?.charAt(0).toUpperCase() + property.status?.slice(1)}

🏢 Magixland Real Estate`
  }

  const copyToClipboard = async (property) => {
    try {
      const text = generateClipboardText(property)
      await navigator.clipboard.writeText(text)
      toast.success('Property details copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = generateClipboardText(property)
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Property details copied to clipboard!')
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [user])

  useEffect(() => {
    filterProperties()
  }, [searchTerm, statusFilter, properties])

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:profiles!properties_agent_id_fkey(name, email),
          project:projects(name, location)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProperties(data || [])
      setFilteredProperties(data || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const filterProperties = () => {
    let filtered = [...properties]

    if (searchTerm) {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.agent?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.property_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.owner_details?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.broker_details?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((property) => property.status === statusFilter)
    }

    setFilteredProperties(filtered)
  }

  const handleDelete = async (propertyId) => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (error) throw error
      toast.success('Property deleted successfully')
      fetchProperties()
    } catch (error) {
      console.error('Error deleting property:', error)
      toast.error('Failed to delete property')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brown"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-brown">Magixland Properties</h1>
            <p className="text-brown-light mt-1 sm:mt-2 text-sm sm:text-base">View and manage all property listings</p>
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
            <Link to="/agent/properties/add" className="btn-primary flex items-center justify-center sm:justify-start">
              <Plus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Add Property</span>
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
                placeholder="Search properties..."
                className="input-field pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field sm:w-48"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-brown-light">
          Showing {filteredProperties.length} of {properties.length} properties
        </div>

        {/* Properties Display */}
        {filteredProperties.length === 0 ? (
          <div className="card text-center py-8 sm:py-12">
            <Home className="w-10 h-10 sm:w-12 sm:h-12 text-brown-light mx-auto mb-3 sm:mb-4" />
            <p className="text-brown-light mb-4 text-sm sm:text-base">No properties found</p>
            {properties.length === 0 && (
              <Link to="/agent/properties/add" className="btn-primary">
                Add Your First Property
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProperties.map((property) => (
              <div key={property.id} className="card-elevated">
                {/* Image */}
                <div className="w-full h-40 sm:h-48 bg-cream rounded-lg overflow-hidden mb-4">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-10 h-10 sm:w-12 sm:h-12 text-brown-light" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-brown line-clamp-1 flex-1 mr-2">
                      {property.title}
                    </h3>
                    <span
                      className={`badge ${
                        property.status === 'available'
                          ? 'badge-success'
                          : property.status === 'pending'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-brown-light mb-3">{property.project?.name}</p>
                  
                  {/* Code and Agent in single row */}
                  <div className="flex items-center justify-between text-xs text-brown-light mb-3">
                    {property.property_code && (
                      <span className="font-medium text-brown">Code: {property.property_code}</span>
                    )}
                    <span>Agent: {property.agent?.name}</span>
                  </div>
                  
                  {/* Price */}
                  <p className="text-lg sm:text-xl font-semibold text-brown mb-3">
                    ₹{property.price?.toLocaleString('en-IN')}
                  </p>
                  
                  {/* Property specs with icons */}
                  <div className="flex items-center text-xs sm:text-sm text-brown-light space-x-3 sm:space-x-4">
                    <div className="flex items-center">
                      <i className="fas fa-bed mr-1 text-brown-light"></i>
                      <span>{property.bedrooms > 0 ? `${property.bedrooms} beds` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-bath mr-1 text-brown-light"></i>
                      <span>{property.bathrooms > 0 ? `${property.bathrooms} baths` : 'N/A'}</span>
                    </div>
                    {property.area && (
                      <div className="flex items-center">
                        <i className="fas fa-ruler-combined mr-1 text-brown-light"></i>
                        <span>{parseFloat(property.area) || property.area} sqft</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-cream-dark">
                  <div className="flex items-center justify-between">
                    {/* Primary Actions - Icon buttons */}
                    <div className="flex items-center space-x-1">
                      <Link
                        to={`/agent/properties/details/${property.id}`}
                        className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => shareOnWhatsApp(property)}
                        className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(property)}
                        className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                        title="Copy details"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Secondary Actions - Icon buttons (only for own properties) */}
                    {property.agent_id === user.id ? (
                      <div className="flex items-center space-x-1">
                        <Link
                          to={`/agent/properties/edit/${property.id}`}
                          className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                          title="Edit property"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="flex p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                          title="Delete property"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-brown-light">
                        Other Agent's Property
                      </div>
                    )}
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Property</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Price</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Area</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-brown">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr key={property.id} className="border-b border-cream-dark hover:bg-cream transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                          {property.images && property.images.length > 0 ? (
                            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="w-6 h-6 text-brown-light" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brown">{property.title}</p>
                          <p className="text-xs text-brown-light">{property.project?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-brown-light">{property.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-brown">₹{property.price?.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <i className="fas fa-ruler-combined text-brown-light"></i>
                        <span className="text-sm text-brown-light">
                          {property.area ? `${parseFloat(property.area) || property.area} sqft` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${
                        property.status === 'available'
                          ? 'badge-success'
                          : property.status === 'pending'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to={`/agent/properties/details/${property.id}`}
                          className="p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => shareOnWhatsApp(property)}
                          className="p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(property)}
                          className="p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                          title="Copy details"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {property.agent_id === user.id && (
                          <>
                            <Link
                              to={`/agent/properties/edit/${property.id}`}
                              className="p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                              title="Edit property"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(property.id)}
                              className="p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                              title="Delete property"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </Layout>
  )
}

