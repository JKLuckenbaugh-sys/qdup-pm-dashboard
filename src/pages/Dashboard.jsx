import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy, collectionGroup, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/layout/TopBar'
import { getInitials, formatDate, isOverdue } from '../utils/constants'

export default function Dashboard() {
  const { onMenuToggle } = useOutletContext()
  const { profile, isAdmin, isClient } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('name'))
    return onSnapshot(q, snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const visibleClients = isClient
    ? clients.filter(c => c.id === profile?.clientId)
    : clients

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen">
      <TopBar onMenuToggle={onMenuToggle} />

      <div className="px-4 lg:px-8 py-8 max-w-6xl mx-auto">
        {/* Welcome header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            {greeting()}, {profile?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-gray-500">Here's what's happening across your projects.</p>
        </div>

        {/* Clients grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-white text-lg">
              {isClient ? 'Your Projects' : 'Clients'}
            </h2>
            {isAdmin && (
              <Link to="/admin" className="btn-ghost text-xs">
                + Add client
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="card p-5 h-32 animate-pulse bg-[#0f1519]" />
              ))}
            </div>
          ) : visibleClients.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#E87722]/10 border border-[#E87722]/30 flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E87722" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <p className="text-gray-400 font-medium mb-1">No clients yet</p>
              <p className="text-gray-600 text-sm">Head to Admin to add your first client.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleClients.map(client => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ClientCard({ client }) {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'clients', client.id, 'projects'), orderBy('name'))
    return onSnapshot(q, snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [client.id])

  return (
    <Link to={`/clients/${client.id}`} className="card p-5 hover:border-[#2a3d4f] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 block group">
      <div className="flex items-start gap-3 mb-4">
        {/* Client avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-black flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: client.color || '#E87722' }}
        >
          {client.logoUrl ? <img src={client.logoUrl} alt={client.name} className="w-full h-full object-contain p-1" /> : getInitials(client.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-white text-base group-hover:text-[#E87722] transition-colors truncate">{client.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 mt-1">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      {/* Projects list preview */}
      <div className="space-y-1.5">
        {projects.slice(0, 3).map(p => (
          <div key={p.id} className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-[#2a3d4f]" />
            <span className="text-xs text-gray-400 truncate">{p.name}</span>
          </div>
        ))}
        {projects.length > 3 && (
          <p className="text-xs text-gray-600 pl-3">+{projects.length - 3} more</p>
        )}
        {projects.length === 0 && (
          <p className="text-xs text-gray-600">No projects yet</p>
        )}
      </div>
    </Link>
  )
}
