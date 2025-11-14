import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

export default function AgentAddRequirement() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    property_type: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    preferred_locations: [],
    priority: 'medium',
    notes: '',
    new_location: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleAddLocation = () => {
    if (formData.new_location.trim()) {
      setFormData({
        ...formData,
        preferred_locations: [...formData.preferred_locations, formData.new_location.trim()],
        new_location: ''
      })
    }
  }

  const handleRemoveLocation = (index) => {
    setFormData({
      ...formData,
      preferred_locations: formData.preferred_locations.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const requirementData = {
        title: formData.title,
        description: formData.description,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        property_type: formData.property_type,
        price: formData.price ? parseFloat(formData.price) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        preferred_locations: formData.preferred_locations,
        priority: formData.priority,
        assigned_agent_id: user.id, // Auto-assign to current agent
        notes: formData.notes,
        created_by: user.id,
        status: 'active'
      }

      const { error } = await supabase
        .from('property_requirements')
        .insert([requirementData])

      if (error) throw error

      toast.success('Property requirement added successfully')
      navigate('/agent/requirements')
    } catch (error) {
      console.error('Error adding requirement:', error)
      toast.error(`Failed to add requirement: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/agent/requirements')}
          className="flex items-center text-primary-600 hover:text-primary-900 mb-4 sm:mb-6 touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm sm:text-base">Back to Requirements</span>
        </button>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-primary-900">Add Property Requirement</h1>
          <p className="text-primary-600 mt-1 sm:mt-2 text-sm sm:text-base">Add a new customer property requirement</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5 sm:space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Requirement Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., 3BHK Apartment in Sector 62"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                rows="3"
                placeholder="Detailed description of the requirement..."
              />
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary-900">Customer Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+91 9876543210"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                className="input-field"
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Property Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary-900">Property Requirements</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Property Type
                </label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className="input-field"
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
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Price (INR)
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
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
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
                <label className="block text-sm font-medium text-primary-700 mb-2">
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
                <label className="block text-sm font-medium text-primary-700 mb-2">
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
          </div>

          {/* Preferred Locations */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary-900">Preferred Locations</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                name="new_location"
                value={formData.new_location}
                onChange={handleChange}
                className="input-field flex-1"
                placeholder="Add a preferred location"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
              />
              <button
                type="button"
                onClick={handleAddLocation}
                className="btn-secondary"
              >
                Add
              </button>
            </div>

            {formData.preferred_locations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.preferred_locations.map((location, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {location}
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary-900">Additional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field"
                rows="3"
                placeholder="Additional notes about this requirement..."
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-primary-100">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Saving...' : 'Add Requirement'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/agent/requirements')}
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
