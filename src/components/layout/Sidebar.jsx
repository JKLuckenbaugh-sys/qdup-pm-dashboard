import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { getInitials, getAvatarColor } from '../../utils/constants'

const Logo = () => (
  <div className="px-4 py-4 border-b border-[#1e2d3a]">
    <img src="/qdup-logo.png" alt="Q'd Up" className="h-8 object-contain object-left" />
  </div>
)

export default function Sidebar({ open, onClose }) {
  const { profile, logout, isAdmin, isClient } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [expandedClients, setExpandedClients] = useState({})

  useEffect(() => {
    if (!profile) return
    const q = query(collection(db, 'clients'), orderBy('name'))
    const unsub = onSnapshot(q, snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [profile])

  function toggleClient(id) {
    setExpandedClients(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#0c1117] border-r border-[#1e2d3a]">
      <Logo />

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {/* Dashboard */}
        <Link to="/" onClick={onClose} className={isActive('/') ? 'nav-item-active' : 'nav-item'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          Dashboard
        </Link>

        {/* Clients section */}
        {!isClient && (
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="label text-[10px]">Clients</span>
              {isAdmin && (
                <Link to="/admin" onClick={onClose} className="text-gray-500 hover:text-[#E87722] transition-colors" title="Manage clients">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </Link>
              )}
            </div>
            {clients.map(client => (
              <ClientNavItem
                key={client.id}
                client={client}
                expanded={expandedClients[client.id]}
                onToggle={() => toggleClient(client.id)}
                onClose={onClose}
                location={location}
              />
            ))}
            {clients.length === 0 && (
              <p className="text-gray-600 text-xs px-3 py-2">No clients yet</p>
            )}
          </div>
        )}

        {/* Client portal view */}
        {isClient && (
          <div className="pt-4">
            <div className="px-3 mb-2">
              <span className="label text-[10px]">Your Projects</span>
            </div>
            {clients
              .filter(c => c.id === profile?.clientId)
              .map(client => (
                <ClientNavItem
                  key={client.id}
                  client={client}
                  expanded={true}
                  onToggle={() => {}}
                  onClose={onClose}
                  location={location}
                />
              ))}
          </div>
        )}

        {/* Admin */}
        {isAdmin && (
          <div className="pt-4">
            <div className="px-3 mb-2">
              <span className="label text-[10px]">Admin</span>
            </div>
            <Link to="/admin" onClick={onClose} className={isActive('/admin') ? 'nav-item-active' : 'nav-item'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Team & Users
            </Link>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-[#1e2d3a]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(profile?.name || '') }}
          >
            {getInitials(profile?.name || profile?.email || '?')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.name || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-white transition-colors tooltip" data-tip="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {open && <div className="sidebar-overlay lg:hidden animate-fade-in" onClick={onClose} />}

      <aside className="hidden lg:block w-60 h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>

      <aside className={`lg:hidden fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    </>
  )
}

function ClientNavItem({ client, expanded, onToggle, onClose, location }) {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    if (!expanded) return
    const q = query(collection(db, 'clients', client.id, 'projects'), orderBy('name'))
    const unsub = onSnapshot(q, snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [client.id, expanded])

  const clientPath = `/clients/${client.id}`
  const isClientActive = location.pathname.startsWith(clientPath)

  return (
    <div>
      <button onClick={onToggle} className={`nav-item w-full text-left ${isClientActive ? 'text-white' : ''}`}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: client.color || '#E87722' }} />
        <span className="flex-1 truncate">{client.name}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      {expanded && (
        <div className="ml-5 pl-3 border-l border-[#1e2d3a] mt-0.5 space-y-0.5">
          {projects.map(p => {
            const path = `/clients/${client.id}/projects/${p.id}`
            return (
              <Link
                key={p.id}
                to={path}
                onClick={onClose}
                className={`block px-3 py-1.5 rounded-lg text-xs truncate transition-colors ${
                  location.pathname === path
                    ? 'text-[#E87722] bg-[#E87722]/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.name}
              </Link>
            )
          })}
          {projects.length === 0 && <span className="block px-3 py-1.5 text-xs text-gray-600">No projects</span>}
        </div>
      )}
    </div>
  )
}
