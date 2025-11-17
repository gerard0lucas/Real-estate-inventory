import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Building2,
  LayoutDashboard,
  Users,
  FolderKanban,
  Home,
  LogOut,
  Menu,
  X,
  User,
  ClipboardList,
} from 'lucide-react'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, faIcon: 'fas fa-tachometer-alt' },
    { name: 'Manage Agents', href: '/admin/agents', icon: Users, faIcon: 'fas fa-users' },
    { name: 'Projects', href: '/admin/projects', icon: FolderKanban, faIcon: 'fas fa-folder-open' },
    { name: 'Properties', href: '/admin/properties', icon: Home, faIcon: 'fas fa-home' },
    { name: 'Requirements', href: '/admin/requirements', icon: ClipboardList, faIcon: 'fas fa-clipboard-list' },
  ]

  const agentNavigation = [
    { name: 'Dashboard', href: '/agent/dashboard', icon: LayoutDashboard, faIcon: 'fas fa-tachometer-alt' },
    { name: 'Projects', href: '/agent/projects', icon: FolderKanban, faIcon: 'fas fa-folder-open' },
    { name: 'All Properties', href: '/agent/properties', icon: Home, faIcon: 'fas fa-home' },
    { name: 'Requirements', href: '/agent/requirements', icon: ClipboardList, faIcon: 'fas fa-clipboard-list' },
  ]

  const navigation = isAdmin ? adminNavigation : agentNavigation

  return (
    <div className="min-h-screen bg-cream-light">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="fixed inset-0 bg-brown/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-80 bg-cream-light border-r border-cream-dark flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-cream-dark flex-shrink-0">
            <div className="flex items-center">
              <div className="h-14 w-auto overflow-hidden">
                <img 
                  src="https://magixland.in/images/magixland%20logo.jpg" 
                  alt="Magixland Logo" 
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-cream transition-colors touch-manipulation"
            >
              <i className="fas fa-times text-brown text-lg"></i>
            </button>
          </div>
          
          {/* Navigation - Takes remaining space */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto min-h-0">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`mobile-nav-item ${
                    isActive ? 'mobile-nav-item-active' : 'mobile-nav-item-inactive'
                  }`}
                >
                  <i className={`${item.faIcon} w-5 h-5 mr-3 flex-shrink-0 text-lg`}></i>
                  <span className="truncate font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>
          
          {/* Profile and Sign Out - Fixed at Bottom */}
          <div className="flex-shrink-0 p-3 border-t border-cream-dark">
            <div className="flex items-center mb-3 p-3 rounded-xl bg-gradient-to-r from-cream to-cream-dark border border-brown-medium">
              <div className="w-10 h-10 bg-gradient-to-br from-brown to-brown-dark rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <i className="fas fa-user text-cream-light text-sm"></i>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-brown truncate">
                  {profile?.name}
                </p>
                <p className="text-xs text-brown-light truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-sm text-brown-light hover:bg-cream hover:text-brown rounded-xl transition-colors border border-transparent hover:border-brown-medium touch-manipulation font-medium"
            >
              <i className="fas fa-sign-out-alt w-4 h-4 mr-3 flex-shrink-0"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col h-full bg-cream-light border-r border-cream-dark">
          {/* Header */}
          <div className="flex items-center flex-shrink-0 px-6 py-8 border-b border-cream-dark">
            <div className="h-14 w-auto overflow-hidden">
              <img 
                src="https://magixland.in/images/magixland%20logo.jpg" 
                alt="Magixland Logo" 
                className="h-full w-auto object-contain"
              />
            </div>
          </div>
          
          {/* Navigation - Takes remaining space */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link ${
                    isActive ? 'nav-link-active' : 'nav-link-inactive'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Profile and Sign Out - Fixed at Bottom */}
          <div className="flex-shrink-0 p-4 border-t border-cream-dark">
            <div className="flex items-center mb-4 p-3 rounded-lg bg-cream border border-cream-dark">
              <div className="w-10 h-10 bg-cream-dark rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-brown" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-brown truncate">
                  {profile?.name}
                </p>
                <p className="text-xs text-brown-light truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-sm text-brown-light hover:bg-cream hover:text-brown rounded-lg transition-colors border border-transparent hover:border-brown-medium"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="mobile-header lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-3 hover:bg-cream transition-colors touch-manipulation"
            >
              <i className="fas fa-bars text-brown text-lg"></i>
            </button>
            <div className="flex items-center">
              <div className="h-12 w-auto overflow-hidden">
                <img 
                  src="https://magixland.in/images/magixland%20logo.jpg" 
                  alt="Magixland Logo" 
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="py-4 px-3 sm:px-4 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}

