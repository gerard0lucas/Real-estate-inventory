import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { FolderKanban, Plus, Edit2, Trash2, X, MapPin, Grid3X3, Table } from 'lucide-react'

export default function AdminProjects() {
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
  }, [])

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
      toast.error('Failed to save project')
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-brown">Projects</h1>
            <p className="text-brown-light mt-1 sm:mt-2 text-sm sm:text-base">Manage real estate projects</p>
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
            <button onClick={() => handleOpenModal()} className="btn-primary flex items-center justify-center sm:justify-start">
              <Plus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Add Project</span>
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="card text-center py-12">
            <FolderKanban className="w-12 h-12 text-brown-light mx-auto mb-4" />
            <p className="text-brown-light mb-4">No projects yet</p>
            <button onClick={() => handleOpenModal()} className="btn-primary mx-auto">
              Create First Project
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card-elevated">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-brown mb-1">
                      {project.name}
                    </h3>
                    {project.location && (
                      <div className="flex items-center text-xs sm:text-sm text-brown-light mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {project.location}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleOpenModal(project)}
                      className="flex p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="flex p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-xs sm:text-sm text-brown-light mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-cream-dark">
                  <div className="text-xs sm:text-sm text-brown-light">
                    <span className="font-semibold text-brown">{project.properties?.[0]?.count || 0}</span> properties
                  </div>
                  <div className="text-xs text-brown-light">
                    by {project.creator?.name || 'Unknown'}
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Project Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Properties</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-brown">Creator</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-brown">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-cream-dark hover:bg-cream transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-brown">{project.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-brown-light" />
                        <span className="text-sm text-brown-light">{project.location || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-brown-light line-clamp-2">
                        {project.description || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-brown-light">
                        <span className="font-semibold text-brown">{project.properties?.[0]?.count || 0}</span> properties
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-brown-light">{project.creator?.name || 'Unknown'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenModal(project)}
                          className="p-2 text-brown-light hover:text-brown hover:bg-cream rounded-lg transition-colors"
                          title="Edit project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                          title="Delete project"
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
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-brown">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h2>
                <button onClick={handleCloseModal} className="text-brown-light hover:text-brown">
                  <X className="w-6 h-6" />
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
                    className="input-field"
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
                    className="input-field"
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
                    className="input-field"
                    rows="4"
                    placeholder="Describe the project..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="submit" className="btn-primary flex-1">
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary flex-1"
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

