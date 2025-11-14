import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  Edit2,
  Copy,
  Share2,
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react'

export default function RequirementDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [requirement, setRequirement] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequirement()
  }, [id])

  const fetchRequirement = async () => {
    try {
      const { data, error } = await supabase
        .from('property_requirements')
        .select(`
          *,
          assigned_agent:profiles!assigned_agent_id(id, name, email),
          created_by_profile:profiles!created_by(id, name, email)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setRequirement(data)
    } catch (error) {
      console.error('Error fetching requirement:', error)
      toast.error('Failed to load requirement details')
      navigate('/admin/requirements')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-brown-light bg-cream'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brown"></div>
        </div>
      </Layout>
    )
  }

  if (!requirement) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-brown-light">Requirement not found</p>
          <Link to="/admin/requirements" className="btn-primary mt-4">
            Back to Requirements
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
                to="/admin/requirements"
                className="p-2 text-brown hover:bg-cream transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brown">{requirement.title}</h1>
                <p className="text-sm sm:text-base text-brown-light mt-1">
                  Created by {requirement.created_by_profile?.name} • {new Date(requirement.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => {}}
                className="p-2 sm:p-3 text-brown-light hover:text-brown hover:bg-cream transition-colors"
                title="Copy details"
              >
                <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => {}}
                className="p-2 sm:p-3 text-brown-light hover:text-brown hover:bg-cream transition-colors"
                title="Share on WhatsApp"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <Link
                to={`/admin/requirements/edit/${requirement.id}`}
                className="p-2 sm:p-3 text-brown-light hover:text-brown hover:bg-cream transition-colors"
                title="Edit requirement"
              >
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
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
                  <Star className="w-4 h-4 text-brown-light" />
                  <div>
                    <p className="text-xs text-brown-light">Priority</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(requirement.priority)}`}>
                      <span className="capitalize">{requirement.priority}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-cream-light border border-cream-dark p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-brown-light" />
                  <div>
                    <p className="text-xs text-brown-light">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(requirement.status)}`}>
                      {getStatusIcon(requirement.status)}
                      <span className="ml-1 capitalize">{requirement.status}</span>
                    </span>
                  </div>
                </div>
              </div>
              {requirement.price && (
                <div className="bg-cream-light border border-cream-dark p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-brown">₹</span>
                    <div>
                      <p className="text-xs text-brown-light">Price</p>
                      <p className="text-sm font-bold text-brown">₹{requirement.price.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-cream-light border border-cream-dark p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-brown-light" />
                  <div>
                    <p className="text-xs text-brown-light">Type</p>
                    <p className="text-sm font-bold text-brown">{requirement.property_type || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {requirement.description && (
              <div className="bg-cream-light border border-cream-dark p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-brown mb-4">Description</h2>
                <p className="text-brown-light leading-relaxed">{requirement.description}</p>
              </div>
            )}

            {/* Property Requirements */}
            <div className="bg-cream-light border border-cream-dark p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-brown mb-4">Property Requirements</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {requirement.bedrooms && (
                  <div>
                    <label className="text-sm font-medium text-brown-light">Bedrooms</label>
                    <p className="text-lg font-semibold text-brown">{requirement.bedrooms}</p>
                  </div>
                )}
                {requirement.bathrooms && (
                  <div>
                    <label className="text-sm font-medium text-brown-light">Bathrooms</label>
                    <p className="text-lg font-semibold text-brown">{requirement.bathrooms}</p>
                  </div>
                )}
                {requirement.area && (
                  <div>
                    <label className="text-sm font-medium text-brown-light">Area</label>
                    <p className="text-lg font-semibold text-brown">{requirement.area} sq ft</p>
                  </div>
                )}
                {requirement.price && (
                  <div>
                    <label className="text-sm font-medium text-brown-light">Price</label>
                    <p className="text-lg font-semibold text-brown">₹{requirement.price.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
              
              {requirement.preferred_locations && requirement.preferred_locations.length > 0 && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-brown-light">Preferred Locations</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {requirement.preferred_locations.map((location, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brown text-white">
                        <MapPin className="w-3 h-3 mr-1" />
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {requirement.notes && (
              <div className="bg-cream-light border border-cream-dark p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-brown mb-4">Notes</h2>
                <p className="text-brown-light leading-relaxed">{requirement.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-cream-light border border-cream-dark p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-brown mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-brown" />
                Customer Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-brown-light">Name</label>
                  <p className="text-brown font-medium flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {requirement.customer_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-brown-light">Phone</label>
                  <p className="text-brown font-medium flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {requirement.customer_phone}
                  </p>
                </div>
                {requirement.customer_email && (
                  <div>
                    <label className="text-sm font-medium text-brown-light">Email</label>
                    <p className="text-brown font-medium flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {requirement.customer_email}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Information */}
            <div className="bg-cream-light border border-cream-dark p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-brown mb-4">Assignment Information</h3>
              <div className="space-y-4">
                {requirement.assigned_agent ? (
                  <div>
                    <label className="text-sm font-medium text-brown-light">Assigned Agent</label>
                    <p className="text-brown font-medium">{requirement.assigned_agent.name}</p>
                    <p className="text-sm text-brown-light">{requirement.assigned_agent.email}</p>
                  </div>
                ) : (
                  <p className="text-brown-light">No agent assigned</p>
                )}
                <div>
                  <label className="text-sm font-medium text-brown-light">Created By</label>
                  <p className="text-brown font-medium">{requirement.created_by_profile?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-brown-light">Created Date</label>
                  <p className="text-brown font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(requirement.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-brown-light">Last Updated</label>
                  <p className="text-brown font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(requirement.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
