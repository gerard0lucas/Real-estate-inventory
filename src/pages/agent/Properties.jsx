import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { Home, Plus, Edit2, Trash2, Copy, Search, Share2, Eye, X, MapPin, Phone, User, Building, Calendar, ExternalLink, Grid3X3, Table, Filter } from 'lucide-react'

export default function AgentProperties() {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    maxArea: '',
    project: '',
    minPricePerSqft: '',
    maxPricePerSqft: '',
    source_type: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [propertyCodeTypes, setPropertyCodeTypes] = useState([])
  const [projects, setProjects] = useState([])
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

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
    fetchProjects()
  }, [user])

  useEffect(() => {
    filterProperties()
  }, [searchTerm, filters, properties])

  useEffect(() => {
    if (searchTerm.length > 0) {
      generateSearchSuggestions(searchTerm)
      setShowSuggestions(true)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm, properties])

  const generateSearchSuggestions = (term) => {
    const lowerTerm = term.toLowerCase().trim()
    if (!lowerTerm) {
      setSearchSuggestions([])
      return
    }

    const suggestions = []
    const seen = new Set()
    const maxSuggestions = 10

    // First pass: collect all matching suggestions with priority scoring
    properties.forEach((property) => {
      // Property title (highest priority - exact match at start)
      if (property.title) {
        const titleLower = property.title.toLowerCase()
        if (titleLower.includes(lowerTerm)) {
          const key = `property-${property.title}`
          if (!seen.has(key)) {
            seen.add(key)
            const priority = titleLower.startsWith(lowerTerm) ? 1 : titleLower.indexOf(lowerTerm)
            suggestions.push({
              text: property.title,
              type: 'Property',
              icon: Home,
              priority: priority,
            })
          }
        }
      }

      // Property code (high priority)
      if (property.property_code) {
        const codeLower = property.property_code.toLowerCase()
        if (codeLower.includes(lowerTerm)) {
          const key = `code-${property.property_code}`
          if (!seen.has(key)) {
            seen.add(key)
            const priority = codeLower.startsWith(lowerTerm) ? 2 : codeLower.indexOf(lowerTerm) + 100
            suggestions.push({
              text: property.property_code,
              type: 'Code',
              icon: Building,
              priority: priority,
            })
          }
        }
      }

      // Project name
      if (property.project?.name) {
        const projectLower = property.project.name.toLowerCase()
        if (projectLower.includes(lowerTerm)) {
          const key = `project-${property.project.name}`
          if (!seen.has(key)) {
            seen.add(key)
            const priority = projectLower.startsWith(lowerTerm) ? 3 : projectLower.indexOf(lowerTerm) + 200
            suggestions.push({
              text: property.project.name,
              type: 'Project',
              icon: MapPin,
              priority: priority,
            })
          }
        }
      }

      // Address
      if (property.address) {
        const addressLower = property.address.toLowerCase()
        if (addressLower.includes(lowerTerm)) {
          const addressPreview = property.address.length > 50 
            ? property.address.substring(0, 50) + '...'
            : property.address
          const key = `address-${property.address}`
          if (!seen.has(key)) {
            seen.add(key)
            const priority = addressLower.startsWith(lowerTerm) ? 4 : addressLower.indexOf(lowerTerm) + 300
            suggestions.push({
              text: addressPreview,
              type: 'Address',
              icon: MapPin,
              priority: priority,
            })
          }
        }
      }

      // Agent name
      if (property.agent?.name) {
        const agentLower = property.agent.name.toLowerCase()
        if (agentLower.includes(lowerTerm)) {
          const key = `agent-${property.agent.name}`
          if (!seen.has(key)) {
            seen.add(key)
            const priority = agentLower.startsWith(lowerTerm) ? 5 : agentLower.indexOf(lowerTerm) + 400
            suggestions.push({
              text: property.agent.name,
              type: 'Agent',
              icon: User,
              priority: priority,
            })
          }
        }
      }
    })

    // Sort by priority (lower number = higher priority) and limit
    const sortedSuggestions = suggestions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, maxSuggestions)
      .map(({ priority, ...rest }) => rest) // Remove priority from final result

    setSearchSuggestions(sortedSuggestions)
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.text)
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || searchSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex((prev) =>
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(searchSuggestions[selectedSuggestionIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, location')
        .order('name', { ascending: true })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

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
      const propertiesData = data || []
      setProperties(propertiesData)
      setFilteredProperties(propertiesData)
      
      // Extract unique property_code_type values
      const uniqueTypes = [...new Set(propertiesData
        .map(p => p.property_code_type)
        .filter(Boolean) // Remove null/undefined values
      )].sort()
      setPropertyCodeTypes(uniqueTypes)
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const filterProperties = () => {
    let filtered = [...properties]

    // Search filter - more comprehensive matching
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((property) => {
        // Check title
        if (property.title?.toLowerCase().includes(lowerSearchTerm)) return true
        
        // Check property code
        if (property.property_code?.toLowerCase().includes(lowerSearchTerm)) return true
        
        // Check project name
        if (property.project?.name?.toLowerCase().includes(lowerSearchTerm)) return true
        
        // Check address
        if (property.address?.toLowerCase().includes(lowerSearchTerm)) return true
        
        // Check agent name
        if (property.agent?.name?.toLowerCase().includes(lowerSearchTerm)) return true
        
        // Check owner details
        if (property.owner_details?.name?.toLowerCase().includes(lowerSearchTerm)) return true
        if (property.owner_details?.phone?.includes(lowerSearchTerm)) return true
        
        // Check broker details
        if (property.broker_details?.name?.toLowerCase().includes(lowerSearchTerm)) return true
        if (property.broker_details?.phone?.includes(lowerSearchTerm)) return true
        
        // Check description
        if (property.description?.toLowerCase().includes(lowerSearchTerm)) return true
        
        // Check type
        if (property.type?.toLowerCase().includes(lowerSearchTerm)) return true
        if (property.property_code_type?.toLowerCase().includes(lowerSearchTerm)) return true
        
        // Check source type
        const propertySourceType = property.source_type || 'Others'
        if (propertySourceType.toLowerCase().includes(lowerSearchTerm)) return true
        
        return false
      })
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((property) => property.status === filters.status)
    }

    // Type filter (using property_code_type)
    if (filters.type) {
      filtered = filtered.filter((property) => property.property_code_type === filters.type)
    }

    // Price range filter
    if (filters.minPrice) {
      filtered = filtered.filter((property) => property.price >= parseFloat(filters.minPrice))
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((property) => property.price <= parseFloat(filters.maxPrice))
    }

    // Bedrooms filter
    if (filters.bedrooms) {
      if (filters.bedrooms === '4+') {
        filtered = filtered.filter((property) => property.bedrooms >= 4)
      } else {
        filtered = filtered.filter((property) => property.bedrooms === parseInt(filters.bedrooms))
      }
    }

    // Bathrooms filter
    if (filters.bathrooms) {
      if (filters.bathrooms === '4+') {
        filtered = filtered.filter((property) => property.bathrooms >= 4)
      } else {
        filtered = filtered.filter((property) => property.bathrooms === parseInt(filters.bathrooms))
      }
    }

    // Area range filter
    if (filters.minArea) {
      filtered = filtered.filter((property) => property.area && parseFloat(property.area) >= parseFloat(filters.minArea))
    }
    if (filters.maxArea) {
      filtered = filtered.filter((property) => property.area && parseFloat(property.area) <= parseFloat(filters.maxArea))
    }

    // Project filter
    if (filters.project) {
      filtered = filtered.filter((property) => property.project_id === filters.project)
    }

    // Source type filter
    if (filters.source_type) {
      filtered = filtered.filter((property) => {
        const propertySourceType = property.source_type || 'Others' // Default to 'Others' if null
        return propertySourceType === filters.source_type
      })
    }

    // Price per sqft range filter
    if (filters.minPricePerSqft) {
      filtered = filtered.filter((property) => {
        if (!property.price_per_sqft) return false
        return parseFloat(property.price_per_sqft) >= parseFloat(filters.minPricePerSqft)
      })
    }
    if (filters.maxPricePerSqft) {
      filtered = filtered.filter((property) => {
        if (!property.price_per_sqft) return false
        return parseFloat(property.price_per_sqft) <= parseFloat(filters.maxPricePerSqft)
      })
    }

    setFilteredProperties(filtered)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({
      status: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      minArea: '',
      maxArea: '',
      project: '',
      minPricePerSqft: '',
      maxPricePerSqft: '',
      source_type: '',
    })
  }

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(v => v !== '').length
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-brown">Magixland Properties</h1>
              <p className="text-brown-light mt-1 text-xs sm:text-sm lg:text-base">View and manage all property listings</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Grid/Table Toggle */}
              <div className="flex items-center border border-cream-dark rounded-lg overflow-hidden bg-cream-light">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 transition-colors touch-manipulation ${
                    viewMode === 'grid'
                      ? 'bg-cream text-brown border-r border-cream-dark'
                      : 'bg-cream-light text-brown-light hover:bg-cream'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-medium hidden xs:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 transition-colors touch-manipulation ${
                    viewMode === 'table'
                      ? 'bg-cream text-brown border-l border-cream-dark'
                      : 'bg-cream-light text-brown-light hover:bg-cream'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-medium hidden xs:inline">Table</span>
                </button>
              </div>
              <Link 
                to="/agent/properties/add" 
                className="btn-primary flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base touch-manipulation"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span className="hidden sm:inline">Add Property</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="card mb-4 sm:mb-6 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-brown-light z-10" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setSelectedSuggestionIndex(-1)
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
                onBlur={(e) => {
                  // Only hide if not clicking on a suggestion
                  const relatedTarget = e.relatedTarget
                  if (!relatedTarget || !relatedTarget.closest('.search-suggestions')) {
                    setTimeout(() => setShowSuggestions(false), 150)
                  }
                }}
                placeholder="Search properties..."
                className="input-field pl-9 sm:pl-10 text-sm sm:text-base py-2.5 sm:py-3"
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions absolute top-full left-0 right-0 mt-1 bg-white border border-cream-dark rounded-lg shadow-lg z-50 max-h-64 sm:max-h-80 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon
                    return (
                      <button
                        key={`${suggestion.type}-${suggestion.text}-${index}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault() // Prevent input blur
                          handleSuggestionClick(suggestion)
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 hover:bg-cream active:bg-cream transition-colors touch-manipulation ${
                          index === selectedSuggestionIndex ? 'bg-cream' : ''
                        } ${index !== searchSuggestions.length - 1 ? 'border-b border-cream-dark' : ''}`}
                      >
                        <Icon className="w-4 h-4 text-brown-light flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-brown truncate">
                            {suggestion.text}
                          </div>
                          <div className="text-xs text-brown-light">
                            {suggestion.type}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center justify-center relative py-2.5 sm:py-3 text-sm sm:text-base touch-manipulation"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <span className="ml-2 bg-brown text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-cream-dark space-y-4 sm:space-y-6">
              {/* Basic Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Property Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Types</option>
                    {propertyCodeTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Source Type</label>
                  <select
                    value={filters.source_type}
                    onChange={(e) => setFilters({ ...filters, source_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Sources</option>
                    <option value="Inhouse">Inhouse</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Project</label>
                  <select
                    value={filters.project}
                    onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} {project.location ? `- ${project.location}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Property Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Bedrooms</label>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4+">4+ Bedrooms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Bathrooms</label>
                  <select
                    value={filters.bathrooms}
                    onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="1">1 Bathroom</option>
                    <option value="2">2 Bathrooms</option>
                    <option value="3">3 Bathrooms</option>
                    <option value="4+">4+ Bathrooms</option>
                  </select>
                </div>
              </div>

              {/* Price & Area Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Min Price (₹)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    placeholder="0"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Max Price (₹)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    placeholder="No limit"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Min Area (sqft)</label>
                  <input
                    type="number"
                    value={filters.minArea}
                    onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
                    placeholder="0"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Max Area (sqft)</label>
                  <input
                    type="number"
                    value={filters.maxArea}
                    onChange={(e) => setFilters({ ...filters, maxArea: e.target.value })}
                    placeholder="No limit"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Price per Sqft Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Min Price/sqft (₹)</label>
                  <input
                    type="number"
                    value={filters.minPricePerSqft}
                    onChange={(e) => setFilters({ ...filters, minPricePerSqft: e.target.value })}
                    placeholder="0"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-2">Max Price/sqft (₹)</label>
                  <input
                    type="number"
                    value={filters.maxPricePerSqft}
                    onChange={(e) => setFilters({ ...filters, maxPricePerSqft: e.target.value })}
                    placeholder="No limit"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 sm:pt-2 border-t border-cream-dark">
                <button 
                  onClick={clearFilters} 
                  className="btn-secondary text-sm flex items-center justify-center gap-2 py-2.5 sm:py-2 touch-manipulation"
                  disabled={getActiveFiltersCount() === 0}
                >
                  <X className="w-4 h-4" />
                  Clear All Filters ({getActiveFiltersCount()})
                </button>
                <div className="text-xs sm:text-sm text-brown-light text-center sm:text-right">
                  {filteredProperties.length} of {properties.length} properties match
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-brown-light px-1">
          Showing {filteredProperties.length} of {properties.length} properties
        </div>

        {/* Properties Display */}
        {filteredProperties.length === 0 ? (
          <div className="card text-center py-8 sm:py-12 px-4">
            <Home className="w-10 h-10 sm:w-12 sm:h-12 text-brown-light mx-auto mb-3 sm:mb-4" />
            <p className="text-brown-light mb-4 text-sm sm:text-base">No properties found</p>
            {properties.length === 0 && (
              <Link to="/agent/properties/add" className="btn-primary text-sm sm:text-base px-4 py-2.5 touch-manipulation">
                Add Your First Property
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {filteredProperties.map((property) => (
              <div key={property.id} className="card-elevated p-3 sm:p-4 lg:p-6">
                {/* Image */}
                <div className="w-full h-40 sm:h-48 bg-cream rounded-lg overflow-hidden mb-3 sm:mb-4">
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
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-brown line-clamp-2 flex-1">
                      {property.title}
                    </h3>
                    <span
                      className={`badge text-xs flex-shrink-0 ${
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
                  
                  <p className="text-xs text-brown-light mb-2 sm:mb-3 line-clamp-1">{property.project?.name}</p>
                  
                  {/* Code and Agent in single row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs text-brown-light mb-2 sm:mb-3">
                    {property.property_code && (
                      <span className="font-medium text-brown">Code: {property.property_code}</span>
                    )}
                    <span className="truncate">Agent: {property.agent?.name}</span>
                  </div>
                  
                  {/* Price */}
                  <p className="text-base sm:text-lg lg:text-xl font-semibold text-brown mb-2 sm:mb-3">
                    ₹{property.price?.toLocaleString('en-IN')}
                  </p>
                  
                  {/* Property specs with icons */}
                  <div className="flex flex-wrap items-center text-xs text-brown-light gap-2 sm:gap-3 sm:space-x-4">
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
                <div className="pt-3 sm:pt-4 border-t border-cream-dark">
                  <div className="flex items-center justify-between gap-2">
                    {/* Primary Actions - Icon buttons */}
                    <div className="flex items-center gap-1 sm:space-x-1">
                      <Link
                        to={`/agent/properties/details/${property.id}`}
                        className="flex p-2 sm:p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors touch-manipulation"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 sm:w-4 sm:h-4" />
                      </Link>
                      <button
                        onClick={() => shareOnWhatsApp(property)}
                        className="flex p-2 sm:p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors touch-manipulation"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-4 h-4 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(property)}
                        className="flex p-2 sm:p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors touch-manipulation"
                        title="Copy details"
                      >
                        <Copy className="w-4 h-4 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    
                    {/* Secondary Actions - Icon buttons (only for own properties) */}
                    {property.agent_id === user.id ? (
                      <div className="flex items-center gap-1 sm:space-x-1">
                        <Link
                          to={`/agent/properties/edit/${property.id}`}
                          className="flex p-2 sm:p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors touch-manipulation"
                          title="Edit property"
                        >
                          <Edit2 className="w-4 h-4 sm:w-4 sm:h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="flex p-2 sm:p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors touch-manipulation"
                          title="Delete property"
                        >
                          <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-brown-light truncate">
                        Other Agent's
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="card overflow-x-auto p-2 sm:p-4">
            <div className="min-w-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream-dark">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown">Property</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown hidden sm:table-cell">Type</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown">Price</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown hidden md:table-cell">Area</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown">Status</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="border-b border-cream-dark hover:bg-cream transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                            {property.images && property.images.length > 0 ? (
                              <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Home className="w-4 h-4 sm:w-6 sm:h-6 text-brown-light" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-semibold text-brown truncate">{property.title}</p>
                            <p className="text-xs text-brown-light truncate hidden sm:block">{property.project?.name}</p>
                            <p className="text-xs text-brown-light sm:hidden">{property.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                        <span className="text-xs sm:text-sm text-brown-light">{property.type}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className="text-xs sm:text-sm font-semibold text-brown">₹{property.price?.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <i className="fas fa-ruler-combined text-brown-light text-xs"></i>
                          <span className="text-xs sm:text-sm text-brown-light">
                            {property.area ? `${parseFloat(property.area) || property.area} sqft` : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className={`badge text-xs ${
                          property.status === 'available'
                            ? 'badge-success'
                            : property.status === 'pending'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}>
                          {property.status}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                          <Link
                            to={`/agent/properties/details/${property.id}`}
                            className="p-1.5 sm:p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors touch-manipulation"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Link>
                          <button
                            onClick={() => shareOnWhatsApp(property)}
                            className="p-1.5 sm:p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors touch-manipulation"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(property)}
                            className="p-1.5 sm:p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors touch-manipulation"
                            title="Copy details"
                          >
                            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          {property.agent_id === user.id && (
                            <>
                              <Link
                                to={`/agent/properties/edit/${property.id}`}
                                className="p-1.5 sm:p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors touch-manipulation"
                                title="Edit property"
                              >
                                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(property.id)}
                                className="p-1.5 sm:p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors touch-manipulation"
                                title="Delete property"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
          </div>
        )}

      </div>
    </Layout>
  )
}

