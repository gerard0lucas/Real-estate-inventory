import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { FolderKanban, Plus, Edit2, Trash2, X, MapPin, Grid3X3, Table } from 'lucide-react'

export default function AgentProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
  })

  useEffect(() => {
    fetchProjects()
  }, [user])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          creator:profiles!projects_created_by_fkey(name),
          properties(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingProject(project)
      setFormData({
        name: project.name,
        description: project.description || '',
        location: project.location || '',
      })
    } else {
      setEditingProject(null)
      setFormData({
        name: '',
        description: '',
        location: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProject(null)
    setFormData({
      name: '',
      description: '',
      location: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(formData)
          .eq('id', editingProject.id)

        if (error) throw error
        toast.success('Project updated successfully')
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([{ ...formData, created_by: user.id }])

        if (error) throw error
        toast.success('Project created successfully')
      }

      handleCloseModal()
      fetchProjects()
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error(`Failed to save project: ${error.message || 'Unknown error'}`)
    }
  }

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project? All associated properties will also be deleted.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      toast.success('Project deleted successfully')
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-brown">Projects</h1>
              <p className="text-brown-light mt-1 text-xs sm:text-sm lg:text-base">Manage real estate projects</p>
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
              <button 
                onClick={() => handleOpenModal()} 
                className="btn-primary flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base touch-manipulation"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span className="hidden sm:inline">Add Project</span>
              </button>
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="card text-center py-8 sm:py-12 px-4">
            <FolderKanban className="w-10 h-10 sm:w-12 sm:h-12 text-brown-light mx-auto mb-3 sm:mb-4" />
            <p className="text-brown-light mb-4 text-sm sm:text-base">No projects yet</p>
            <button 
              onClick={() => handleOpenModal()} 
              className="btn-primary text-sm sm:text-base px-4 py-2.5 touch-manipulation"
            >
              Create First Project
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card-elevated p-3 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-brown mb-1 line-clamp-2">
                      {project.name}
                    </h3>
                    {project.location && (
                      <div className="flex items-center text-xs text-brown-light mb-2">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenModal(project)}
                      className="flex p-1.5 sm:p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors touch-manipulation"
                      title="Edit project"
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="flex p-1.5 sm:p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors touch-manipulation"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-xs sm:text-sm text-brown-light mb-3 sm:mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 sm:pt-4 border-t border-cream-dark">
                  <div className="text-xs sm:text-sm text-brown-light">
                    <span className="font-semibold text-brown">{project.properties?.[0]?.count || 0}</span> properties
                  </div>
                  <div className="text-xs text-brown-light truncate">
                    by {project.creator?.name || 'Unknown'}
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
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown">Project Name</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown hidden sm:table-cell">Location</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown hidden md:table-cell">Description</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown">Properties</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown hidden lg:table-cell">Creator</th>
                    <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-brown">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b border-cream-dark hover:bg-cream transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-brown block truncate">{project.name}</span>
                          <span className="text-xs text-brown-light sm:hidden">{project.location || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brown-light flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-brown-light truncate">{project.location || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                        <span className="text-xs sm:text-sm text-brown-light line-clamp-2">
                          {project.description || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className="text-xs sm:text-sm text-brown-light">
                          <span className="font-semibold text-brown">{project.properties?.[0]?.count || 0}</span> properties
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                        <span className="text-xs sm:text-sm text-brown-light truncate">{project.creator?.name || 'Unknown'}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                          <button
                            onClick={() => handleOpenModal(project)}
                            className="p-1.5 sm:p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors touch-manipulation"
                            title="Edit project"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-1.5 sm:p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors touch-manipulation"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-brown">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h2>
                <button 
                  onClick={handleCloseModal} 
                  className="text-brown-light hover:text-brown touch-manipulation p-1"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-brown mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field text-sm sm:text-base"
                    placeholder="Luxury Apartments Downtown"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field text-sm sm:text-base"
                    placeholder="New York, NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field text-sm sm:text-base"
                    rows="4"
                    placeholder="Describe the project..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 text-sm sm:text-base py-2.5 sm:py-3 touch-manipulation"
                  >
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary flex-1 text-sm sm:text-base py-2.5 sm:py-3 touch-manipulation"
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

