import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import { Users, FolderKanban, Home, TrendingUp, Plus } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalProjects: 0,
    totalProperties: 0,
    availableProperties: 0,
    soldProperties: 0,
    pendingProperties: 0,
  })
  const [recentProperties, setRecentProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch agents count
      const { count: agentsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'agent')

      // Fetch projects count
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })

      // Fetch properties count
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })

      // Fetch properties by status
      const { count: availableCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')

      const { count: soldCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sold')

      const { count: pendingCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Fetch recent properties
      const { data: properties } = await supabase
        .from('properties')
        .select(`
          *,
          agent:profiles!properties_agent_id_fkey(name),
          project:projects(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalAgents: agentsCount || 0,
        totalProjects: projectsCount || 0,
        totalProperties: propertiesCount || 0,
        availableProperties: availableCount || 0,
        soldProperties: soldCount || 0,
        pendingProperties: pendingCount || 0,
      })

      setRecentProperties(properties || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Total Agents',
      value: stats.totalAgents,
      icon: Users,
      color: 'bg-primary-100',
      iconColor: 'text-primary-700',
      link: '/admin/agents',
    },
    {
      name: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderKanban,
      color: 'bg-accent-100',
      iconColor: 'text-accent-700',
      link: '/admin/projects',
    },
    {
      name: 'Total Properties',
      value: stats.totalProperties,
      icon: Home,
      color: 'bg-success-100',
      iconColor: 'text-success-700',
      link: '/admin/properties',
    },
    {
      name: 'Available',
      value: stats.availableProperties,
      icon: TrendingUp,
      color: 'bg-warning-100',
      iconColor: 'text-warning-700',
      link: '/admin/properties?status=available',
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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-primary-900">Admin Dashboard</h1>
          <p className="text-primary-600 mt-1 sm:mt-2 text-sm sm:text-base">Welcome back! Here's your overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link
                key={stat.name}
                to={stat.link}
                className="card-elevated"
              >
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className={`p-2 sm:p-3 rounded-xl ${stat.color} mb-2 sm:mb-0 self-start`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`} />
                  </div>
                  <div className="sm:ml-4">
                    <p className="text-xs sm:text-sm text-primary-600 mb-1">{stat.name}</p>
                    <p className="text-xl sm:text-2xl font-semibold text-primary-900">{stat.value}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="card text-center">
            <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-primary-700">Available</h3>
            <p className="text-xl sm:text-3xl font-semibold text-success-600">{stats.availableProperties}</p>
          </div>
          <div className="card text-center">
            <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-primary-700">Pending</h3>
            <p className="text-xl sm:text-3xl font-semibold text-warning-600">{stats.pendingProperties}</p>
          </div>
          <div className="card text-center">
            <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-primary-700">Sold</h3>
            <p className="text-xl sm:text-3xl font-semibold text-primary-600">{stats.soldProperties}</p>
          </div>
        </div>

        {/* Recent Properties */}
        <div className="card mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-primary-900">Recent Properties</h2>
            <Link to="/admin/properties" className="text-primary-600 hover:text-primary-700 text-sm font-medium self-start sm:self-center">
              View All
            </Link>
          </div>
          {recentProperties.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Home className="w-10 h-10 sm:w-12 sm:h-12 text-primary-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-primary-600 text-sm sm:text-base">No properties yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="mobile-table">
                <thead>
                  <tr className="border-b border-primary-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Project</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Agent</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProperties.map((property) => (
                    <tr key={property.id} className="border-b border-primary-50 hover:bg-primary-50">
                      <td className="py-3 px-4 text-primary-800" data-label="Title">{property.title}</td>
                      <td className="py-3 px-4 text-primary-600" data-label="Project">{property.project?.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-primary-600" data-label="Agent">{property.agent?.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-primary-800 font-medium" data-label="Price">
                        ₹{property.price?.toLocaleString('en-IN') || 'N/A'}
                      </td>
                      <td className="py-3 px-4" data-label="Status">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link to="/admin/agents" className="card-elevated">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary-700 mb-3" />
            <h3 className="font-semibold text-base sm:text-lg mb-2 text-primary-900">Manage Agents</h3>
            <p className="text-xs sm:text-sm text-primary-600">Add, edit, or remove agent accounts</p>
          </Link>
          <Link to="/admin/projects" className="card-elevated">
            <FolderKanban className="w-6 h-6 sm:w-8 sm:h-8 text-primary-700 mb-3" />
            <h3 className="font-semibold text-base sm:text-lg mb-2 text-primary-900">Manage Projects</h3>
            <p className="text-xs sm:text-sm text-primary-600">Create and manage property projects</p>
          </Link>
          <Link to="/admin/properties" className="card-elevated sm:col-span-2 lg:col-span-1">
            <Home className="w-6 h-6 sm:w-8 sm:h-8 text-primary-700 mb-3" />
            <h3 className="font-semibold text-base sm:text-lg mb-2 text-primary-900">All Properties</h3>
            <p className="text-xs sm:text-sm text-primary-600">View and manage all property listings</p>
          </Link>
        </div>
      </div>
    </Layout>
  )
}

