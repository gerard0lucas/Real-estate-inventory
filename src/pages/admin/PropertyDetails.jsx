import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { ArrowLeft, Copy, Share2, Edit2, Trash2 } from 'lucide-react'

export default function PropertyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperty()
  }, [id])

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          project:projects(id, name, location),
          agent:profiles(id, name, email)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setProperty(data)
    } catch (error) {
      console.error('Error fetching property:', error)
      toast.error('Failed to load property details')
      navigate('/admin/properties')
    } finally {
      setLoading(false)
    }
  }

  const generateWhatsAppMessage = (property) => {
    const message = `🏠 *${property.title}*

🔢 *Property Code:* ${property.property_code || 'N/A'}
💰 *Price:* ₹${property.price?.toLocaleString('en-IN') || 'N/A'}
📍 *Location:* ${property.project?.name || 'N/A'}${property.project?.location ? `, ${property.project.location}` : ''}
🏡 *Type:* ${property.type || 'N/A'}
🛏️ *Bedrooms:* ${property.bedrooms || 'N/A'}
🚿 *Bathrooms:* ${property.bathrooms || 'N/A'}
📐 *Area:* ${property.area ? `${property.area} sqft` : 'N/A'}
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
📐 Area: ${property.area ? `${property.area} sqft` : 'N/A'}
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
      toast.success('Property details copied to clipboard')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Property deleted successfully')
      navigate('/admin/properties')
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

  if (!property) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-brown-light">Property not found</p>
          <Link to="/admin/properties" className="btn-primary mt-4">
            Back to Properties
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/properties"
                className="p-2 text-brown hover:bg-cream transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brown">{property.title}</h1>
                <p className="text-sm sm:text-base text-brown-light mt-1">
                  {property.project?.name} • {property.project?.location}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => copyToClipboard(property)}
                className="p-2 sm:p-3 text-brown-light hover:text-brown hover:bg-cream transition-colors"
                title="Copy details"
              >
                <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => shareOnWhatsApp(property)}
                className="p-2 sm:p-3 text-brown-light hover:text-brown hover:bg-cream transition-colors"
                title="Share on WhatsApp"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <Link
                to={`/admin/properties/edit/${property.id}`}
                className="p-2 sm:p-3 text-brown-light hover:text-brown hover:bg-cream transition-colors"
                title="Edit property"
              >
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <button
                onClick={handleDelete}
                className="p-2 sm:p-3 text-brown-light hover:text-red-600 hover:bg-cream transition-colors"
                title="Delete property"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-cream-light border border-cream-dark p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-hashtag text-brown-light"></i>
                  <div>
                    <p className="text-xs text-brown-light">Code</p>
                    <p className="text-sm font-bold text-brown">{property.property_code || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-cream-light border border-cream-dark p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-info-circle text-brown-light"></i>
                  <div>
                    <p className="text-xs text-brown-light">Status</p>
                    <p className="text-sm font-bold text-brown capitalize">{property.status}</p>
                  </div>
                </div>
              </div>
              <div className="bg-cream-light border border-cream-dark p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-rupee-sign text-brown-light"></i>
                  <div>
                    <p className="text-xs text-brown-light">Price</p>
                    <p className="text-sm font-bold text-brown">₹{property.price?.toLocaleString('en-IN') || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-cream-light border border-cream-dark p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-ruler-combined text-brown-light"></i>
                  <div>
                    <p className="text-xs text-brown-light">Area</p>
                    <p className="text-sm font-bold text-brown">{property.area ? `${property.area} sqft` : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            {property.images && property.images.length > 0 && (
              <div className="bg-cream-light border border-cream-dark p-4 sm:p-6 rounded-lg">
                <h2 className="text-lg font-bold text-brown mb-4 flex items-center">
                  <i className="fas fa-images mr-2 text-brown-light"></i>
                  Property Images
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {property.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`${property.title} ${index + 1}`}
                        className="w-full h-48 sm:h-56 object-cover border border-cream-dark rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Details */}
            <div className="bg-cream-light border border-cream-dark p-4 sm:p-6 rounded-lg">
              <h2 className="text-lg font-bold text-brown mb-4 flex items-center">
                <i className="fas fa-info-circle mr-2 text-brown-light"></i>
                Property Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-building text-brown-light"></i>
                  <div>
                    <p className="text-xs text-brown-light">Type</p>
                    <p className="text-sm font-bold text-brown">{property.type || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-bed text-brown-light"></i>
                  <div>
                    <p className="text-xs text-brown-light">Bedrooms</p>
                    <p className="text-sm font-bold text-brown">{property.bedrooms || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-bath text-brown-light"></i>
                  <div>
                    <p className="text-xs text-brown-light">Bathrooms</p>
                    <p className="text-sm font-bold text-brown">{property.bathrooms || 'N/A'}</p>
                  </div>
                </div>
                {property.price_per_sqft && (
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-calculator text-brown-light"></i>
                    <div>
                      <p className="text-xs text-brown-light">Price/SqFt</p>
                      <p className="text-sm font-bold text-brown">₹{property.price_per_sqft.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-cream-light border border-cream-dark p-4 sm:p-6 rounded-lg">
              <h2 className="text-lg font-bold text-brown mb-4 flex items-center">
                <i className="fas fa-align-left mr-2 text-brown-light"></i>
                Description
              </h2>
              <p className="text-sm sm:text-base text-brown-light leading-relaxed">{property.description}</p>
            </div>

            {/* Address & Location */}
            <div className="space-y-4">
              {property.address && (
                <div className="bg-cream-light border border-cream-dark p-4 sm:p-6 rounded-lg">
                  <h2 className="text-lg font-bold text-brown mb-4 flex items-center">
                    <i className="fas fa-map-marker-alt mr-2 text-brown-light"></i>
                    Address
                  </h2>
                  <p className="text-sm sm:text-base text-brown-light">{property.address}</p>
                </div>
              )}

              {property.location_url && (
                <div className="bg-cream-light border border-cream-dark p-4 sm:p-6 rounded-lg">
                  <h2 className="text-lg font-bold text-brown mb-4 flex items-center">
                    <i className="fas fa-link mr-2 text-brown-light"></i>
                    Location URL
                  </h2>
                  <a 
                    href={property.location_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-brown hover:text-brown-dark underline break-all flex items-center"
                  >
                    {property.location_url}
                    <i className="fas fa-external-link-alt ml-2 text-xs"></i>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              {property.owner_details?.name && (
                <div className="bg-cream-light border border-cream-dark p-4 sm:p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-brown mb-4 flex items-center">
                    <i className="fas fa-user mr-2 text-brown-light"></i>
                    Owner Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-user text-brown-light text-xs"></i>
                      <div>
                        <p className="text-xs text-brown-light">Name</p>
                        <p className="text-sm font-bold text-brown">{property.owner_details.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-phone text-brown-light text-xs"></i>
                      <div>
                        <p className="text-xs text-brown-light">Phone</p>
                        <p className="text-sm font-bold text-brown">{property.owner_details.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {property.broker_details?.name && (
                <div className="bg-cream-light border border-cream-dark p-4 sm:p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-brown mb-4 flex items-center">
                    <i className="fas fa-handshake mr-2 text-brown-light"></i>
                    Broker Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-user text-brown-light text-xs"></i>
                      <div>
                        <p className="text-xs text-brown-light">Name</p>
                        <p className="text-sm font-bold text-brown">{property.broker_details.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-phone text-brown-light text-xs"></i>
                      <div>
                        <p className="text-xs text-brown-light">Phone</p>
                        <p className="text-sm font-bold text-brown">{property.broker_details.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Project & Agent Info */}
            <div className="space-y-4">
              <div className="bg-cream-light border border-cream-dark p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-bold text-brown mb-4 flex items-center">
                  <i className="fas fa-building mr-2 text-brown-light"></i>
                  Project Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-building text-brown-light text-xs"></i>
                    <div>
                      <p className="text-xs text-brown-light">Name</p>
                      <p className="text-sm font-bold text-brown">{property.project?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-map-marker-alt text-brown-light text-xs"></i>
                    <div>
                      <p className="text-xs text-brown-light">Location</p>
                      <p className="text-sm font-bold text-brown">{property.project?.location}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-cream-light border border-cream-dark p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-bold text-brown mb-4 flex items-center">
                  <i className="fas fa-user-tie mr-2 text-brown-light"></i>
                  Assigned Agent
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-user text-brown-light text-xs"></i>
                    <div>
                      <p className="text-xs text-brown-light">Name</p>
                      <p className="text-sm font-bold text-brown">{property.agent?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-envelope text-brown-light text-xs"></i>
                    <div>
                      <p className="text-xs text-brown-light">Email</p>
                      <p className="text-sm font-bold text-brown">{property.agent?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
