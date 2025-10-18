import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { Upload, X, ArrowLeft } from 'lucide-react'

export default function AdminEditProperty() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetchingProperty, setFetchingProperty] = useState(true)
  const [projects, setProjects] = useState([])
  const [agents, setAgents] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [formData, setFormData] = useState({
    project_id: '',
    agent_id: '',
    title: '',
    type: '',
    price: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    address: '',
    status: 'available',
    images: [],
    property_code: '',
    property_code_type: '',
    owner_details: {
      name: '',
      phone: ''
    },
    broker_details: {
      name: '',
      phone: ''
    },
    price_per_sqft: '',
    location_url: ''
  })

  useEffect(() => {
    fetchProjects()
    fetchAgents()
    fetchProperty()
  }, [id])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, location')
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
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
      toast.error('Failed to load agents')
    }
  }

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setFormData({
        project_id: data.project_id || '',
        agent_id: data.agent_id || '',
        title: data.title || '',
        type: data.type || '',
        price: data.price || '',
        description: data.description || '',
        bedrooms: data.bedrooms || '',
        bathrooms: data.bathrooms || '',
        area: data.area || '',
        address: data.address || '',
        status: data.status || 'available',
        images: data.images || [],
        property_code: data.property_code || '',
        property_code_type: data.property_code_type || '',
        owner_details: data.owner_details || {
          name: '',
          phone: ''
        },
        broker_details: data.broker_details || {
          name: '',
          phone: ''
        },
        price_per_sqft: data.price_per_sqft || '',
        location_url: data.location_url || ''
      })
    } catch (error) {
      console.error('Error fetching property:', error)
      toast.error('Failed to load property')
      navigate('/admin/properties')
    } finally {
      setFetchingProperty(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.startsWith('owner_details.')) {
      const field = name.split('.')[1]
      setFormData({
        ...formData,
        owner_details: {
          ...formData.owner_details,
          [field]: value
        }
      })
    } else if (name.startsWith('broker_details.')) {
      const field = name.split('.')[1]
      setFormData({
        ...formData,
        broker_details: {
          ...formData.broker_details,
          [field]: value
        }
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      })
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingImages(true)

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `admin/${Date.now()}-${Math.random()}.${fileExt}`

        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(fileName, file)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName)

        return publicUrl
      })

      const imageUrls = await Promise.all(uploadPromises)
      setFormData({
        ...formData,
        images: [...formData.images, ...imageUrls],
      })
      toast.success('Images uploaded successfully')
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      images: newImages,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.agent_id) {
      toast.error('Please select an agent')
      return
    }

    setLoading(true)

    try {
      const propertyData = {
        project_id: formData.project_id,
        agent_id: formData.agent_id,
        title: formData.title,
        type: formData.type,
        price: formData.price ? parseFloat(formData.price) : null,
        description: formData.description,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        address: formData.address,
        status: formData.status,
        images: formData.images,
        property_code: formData.property_code,
        property_code_type: formData.property_code_type,
        owner_details: formData.owner_details,
        broker_details: formData.broker_details,
        price_per_sqft: formData.price_per_sqft ? parseFloat(formData.price_per_sqft) : null,
        location_url: formData.location_url
      }

      const { error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', id)

      if (error) throw error

      toast.success('Property updated successfully')
      navigate('/admin/properties')
    } catch (error) {
      console.error('Error updating property:', error)
      toast.error('Failed to update property')
    } finally {
      setLoading(false)
    }
  }

  if (fetchingProperty) {
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
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin/properties')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Properties
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
          <p className="text-gray-600 mt-2">Update the property details</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Agent Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Agent *
            </label>
            <select
              name="agent_id"
              value={formData.agent_id}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select an agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.email})
                </option>
              ))}
            </select>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project *
            </label>
            <select
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.location}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              placeholder="Modern 3BHK Apartment with City View"
              required
            />
          </div>

          {/* Type, Status, and Property Code in Single Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select type</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="Condo">Condo</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Site">Site</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Code Type
              </label>
              <select
                name="property_code_type"
                value={formData.property_code_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select code type</option>
                <option value="New Apartment">New Apartment - NA001</option>
                <option value="Old Apartment">Old Apartment - OA001</option>
                <option value="New House">New House - NH001</option>
                <option value="Old House">Old House - OH001</option>
                <option value="Site">Site - S001</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (INR) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="input-field"
              placeholder="5000000"
              min="0"
              step="1000"
              required
            />
          </div>

          {/* Price per Square Feet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per Square Feet (INR)
            </label>
            <input
              type="number"
              name="price_per_sqft"
              value={formData.price_per_sqft}
              onChange={handleChange}
              className="input-field"
              placeholder="4167"
              min="0"
              step="1"
            />
          </div>

          {/* Bedrooms, Bathrooms, Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms
              </label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                className="input-field"
                placeholder="3"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms
              </label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                className="input-field"
                placeholder="2"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area (sq ft)
              </label>
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="input-field"
                placeholder="1200"
                min="0"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input-field"
              placeholder="Sector 62, Noida, UP 201301"
            />
          </div>

          {/* Location URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location URL
            </label>
            <input
              type="url"
              name="location_url"
              value={formData.location_url}
              onChange={handleChange}
              className="input-field"
              placeholder="https://maps.google.com/..."
            />
          </div>

          {/* Owner Details Section */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Owner Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name
                </label>
                <input
                  type="text"
                  name="owner_details.name"
                  value={formData.owner_details.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Phone
                </label>
                <input
                  type="tel"
                  name="owner_details.phone"
                  value={formData.owner_details.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
          </div>

          {/* Broker Details Section */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Broker Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Broker Name
                </label>
                <input
                  type="text"
                  name="broker_details.name"
                  value={formData.broker_details.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Broker Phone
                </label>
                <input
                  type="tel"
                  name="broker_details.phone"
                  value={formData.broker_details.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              rows="6"
              placeholder="Describe the property features, amenities, and highlights..."
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label className="btn-primary cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImages}
                  />
                  {uploadingImages ? 'Uploading...' : 'Upload More Images'}
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG, GIF up to 5MB each
                </p>
              </div>

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Property ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6 border-t">
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="btn-primary flex-1"
            >
              {loading ? 'Saving...' : 'Update Property'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/properties')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}


