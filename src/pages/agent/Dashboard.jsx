import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { Home, Plus, TrendingUp, DollarSign, Share2, Copy, ClipboardList } from 'lucide-react'

export default function AgentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    soldProperties: 0,
    pendingProperties: 0,
  })
  const [recentProperties, setRecentProperties] = useState([])
  const [recentRequirements, setRecentRequirements] = useState([])
  const [loading, setLoading] = useState(true)

  const generateWhatsAppMessage = (property) => {
    const message = `🏠 *${property.title}*

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

Status: ${property.status?.charAt(0).toUpperCase() + property.status?.slice(1)}

#PropertyForSale #RealEstate`

    return encodeURIComponent(message)
  }

  const shareOnWhatsApp = (property) => {
    const message = generateWhatsAppMessage(property)
    const whatsappUrl = `https://wa.me/?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const generateClipboardText = (property) => {
    return `🏠 ${property.title}

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

Status: ${property.status?.charAt(0).toUpperCase() + property.status?.slice(1)}`
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
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch all properties
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:profiles!properties_agent_id_fkey(name),
          project:projects(name, location)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        toast.error('Failed to load properties data')
        return
      }

      console.log('Fetched properties:', properties?.length || 0)

      const available = properties?.filter((p) => p.status === 'available').length || 0
      const sold = properties?.filter((p) => p.status === 'sold').length || 0
      const pending = properties?.filter((p) => p.status === 'pending').length || 0

      setStats({
        totalProperties: properties?.length || 0,
        availableProperties: available,
        soldProperties: sold,
        pendingProperties: pending,
      })

      setRecentProperties(properties?.slice(0, 5) || [])

      // Fetch recent requirements
      const { data: requirements } = await supabase
        .from('property_requirements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentRequirements(requirements || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'All Properties',
      value: stats.totalProperties,
      icon: Home,
      color: 'bg-gradient-to-br from-primary-100 to-primary-200',
      iconColor: 'text-primary-700',
      faIcon: 'fas fa-home',
    },
    {
      name: 'Available',
      value: stats.availableProperties,
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-success-100 to-success-200',
      iconColor: 'text-success-700',
      faIcon: 'fas fa-check-circle',
    },
    {
      name: 'Sold',
      value: stats.soldProperties,
      icon: DollarSign,
      color: 'bg-gradient-to-br from-accent-100 to-accent-200',
      iconColor: 'text-accent-700',
      faIcon: 'fas fa-dollar-sign',
    },
    {
      name: 'Pending',
      value: stats.pendingProperties,
      icon: Home,
      color: 'bg-gradient-to-br from-warning-100 to-warning-200',
      iconColor: 'text-warning-700',
      faIcon: 'fas fa-clock',
    },
  ]

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
            <h1 className="text-2xl sm:text-3xl font-semibold text-primary-900">Agent Dashboard</h1>
            <p className="text-primary-600 mt-1 sm:mt-2 text-sm sm:text-base">View all property listings and manage your own</p>
          </div>
          <Link to="/agent/properties/add" className="btn-primary flex items-center justify-center sm:justify-start">
            <Plus className="w-5 h-5 mr-2" />
            Add Property
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="mobile-stat-card">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className={`p-3 sm:p-4 rounded-2xl ${stat.color} mb-3 sm:mb-0 self-start shadow-sm`}>
                    <i className={`${stat.faIcon} ${stat.iconColor} text-lg sm:text-xl`}></i>
                  </div>
                  <div className="sm:ml-4">
                    <p className="text-xs sm:text-sm text-primary-600 mb-1 font-medium">{stat.name}</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>


        {/* Recent Properties */}
        <div className="mobile-form-section mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-primary-900 flex items-center">
              <i className="fas fa-list-ul text-primary-700 mr-2"></i>
              Recent Properties (All)
            </h2>
            <Link
              to="/agent/properties"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium self-start sm:self-center flex items-center"
            >
              <i className="fas fa-external-link-alt mr-1"></i>
              View All
            </Link>
          </div>

          {recentProperties.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <i className="fas fa-home text-primary-600 text-2xl sm:text-3xl"></i>
              </div>
              <p className="text-primary-600 mb-4 text-sm sm:text-base font-medium">No properties yet</p>
              <Link to="/agent/properties/add" className="btn-primary mobile-btn">
                <i className="fas fa-plus mr-2"></i>
                Add Your First Property
              </Link>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {recentProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-start sm:items-center p-4 border border-primary-100 rounded-2xl hover:bg-primary-50 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-home text-primary-400 text-xl sm:text-2xl"></i>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="font-bold text-primary-900 truncate text-sm sm:text-base mb-1">
                      {property.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-primary-600 mb-1 flex items-center">
                      <i className="fas fa-map-marker-alt mr-1 text-primary-500"></i>
                      {property.project?.name}
                    </p>
                    <p className="text-xs text-primary-500 mb-1 flex items-center">
                      <i className="fas fa-user mr-1 text-primary-400"></i>
                      Agent: {property.agent?.name}
                    </p>
                    <p className="text-sm sm:text-base font-bold text-primary-700 flex items-center">
                      <i className="fas fa-rupee-sign mr-1 text-primary-600"></i>
                      ₹{property.price?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(property)}
                        className="p-2 text-primary-600 hover:bg-primary-100 rounded-xl transition-colors touch-manipulation"
                        title="Copy details to clipboard"
                      >
                        <i className="fas fa-copy text-sm"></i>
                      </button>
                      <button
                        onClick={() => shareOnWhatsApp(property)}
                        className="p-2 text-success-600 hover:bg-success-50 rounded-xl transition-colors touch-manipulation"
                        title="Share on WhatsApp"
                      >
                        <i className="fab fa-whatsapp text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Requirements */}
        <div className="mobile-form-section mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-primary-900 flex items-center">
              <i className="fas fa-clipboard-list text-primary-700 mr-2"></i>
              Recent Requirements (All)
            </h2>
            <Link
              to="/agent/requirements"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium self-start sm:self-center flex items-center"
            >
              <i className="fas fa-external-link-alt mr-1"></i>
              View All
            </Link>
          </div>

          {recentRequirements.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <i className="fas fa-clipboard-list text-primary-600 text-2xl sm:text-3xl"></i>
              </div>
              <p className="text-primary-600 mb-4 text-sm sm:text-base font-medium">No requirements yet</p>
              <Link to="/agent/requirements/add" className="btn-primary mobile-btn">
                <i className="fas fa-plus mr-2"></i>
                Add Your First Requirement
              </Link>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {recentRequirements.map((requirement) => (
                <Link
                  key={requirement.id}
                  to={`/agent/requirements/details/${requirement.id}`}
                  className="flex items-start sm:items-center p-4 border border-primary-100 rounded-2xl hover:bg-primary-50 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <i className="fas fa-clipboard-list text-primary-400 text-xl sm:text-2xl"></i>
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="font-bold text-primary-900 truncate text-sm sm:text-base mb-1">
                      {requirement.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-primary-600 mb-1 flex items-center">
                      <i className="fas fa-user mr-1 text-primary-500"></i>
                      {requirement.customer_name}
                    </p>
                    <p className="text-xs text-primary-500 mb-1 flex items-center">
                      <i className="fas fa-home mr-1 text-primary-400"></i>
                      {requirement.property_type || 'N/A'}
                    </p>
                    {requirement.price && (
                      <p className="text-sm sm:text-base font-bold text-primary-700 flex items-center">
                        <i className="fas fa-rupee-sign mr-1 text-primary-600"></i>
                        ₹{requirement.price.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
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
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Link
            to="/agent/properties/add"
            className="mobile-form-section text-center hover:shadow-lg transition-all duration-200"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <i className="fas fa-plus text-primary-700 text-2xl sm:text-3xl"></i>
            </div>
            <h3 className="font-bold text-base sm:text-lg mb-2 text-primary-900">Add New Property</h3>
            <p className="text-xs sm:text-sm text-primary-600">List a new property for sale</p>
          </Link>
          <Link
            to="/agent/properties"
            className="mobile-form-section text-center hover:shadow-lg transition-all duration-200"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <i className="fas fa-home text-primary-700 text-2xl sm:text-3xl"></i>
            </div>
            <h3 className="font-bold text-base sm:text-lg mb-2 text-primary-900">View All Properties</h3>
            <p className="text-xs sm:text-sm text-primary-600">Manage your property listings</p>
          </Link>
        </div>
        
        {/* Floating Action Button for Mobile */}
        <Link
          to="/agent/properties/add"
          className="mobile-floating-btn lg:hidden"
          title="Add New Property"
        >
          <i className="fas fa-plus text-xl"></i>
        </Link>
      </div>
    </Layout>
  )
}

