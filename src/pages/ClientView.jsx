import { useState, useEffect } from 'react'
import { Link, useParams, useOutletContext } from 'react-router-dom'
import { doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/layout/TopBar'
import Modal from '../components/modals/Modal'
import { getInitials, formatDate } from '../utils/constants'

const PROJECT_COLORS = ['#E87722','#4D7FA3','#2D5F7E','#C9621A','#6495B8','#22c55e','#F08D40']

export default function ClientView() {
  const { clientId } = useParams()
  const { onMenuToggle } = useOutletContext()
  const { isAdmin } = useAuth()
  const [client, setClient] = useState(null)
  const [projects, setProjects] = useState([])
  const [showAddProject, setShowAddProject] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'clients', clientId), snap => {
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() })
    })
    return unsub
  }, [clientId])

  useEffect(() => {
    const q = query(collection(db, 'clients', clientId, 'projects'), orderBy('name'))
    return onSnapshot(q, snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [clientId])

  async function handleAddProject(e) {
    e.preventDefault()
    if (!newProject.name.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'clients', clientId, 'projects'), {
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        color: PROJECT_COLORS[projects.length % PROJECT_COLORS.length],
        createdAt: serverTimestamp(),
      })
      setShowAddProject(false)
      setNewProject({ name: '', description: '' })
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar
        onMenuToggle={onMenuToggle}
        title={client?.name || 'Loading...'}
        subtitle="Client workspace"
      />

      <div className="px-4 lg:px-8 py-8 max-w-5xl mx-auto">
        {/* Client header */}
        {client && (
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-black flex-shrink-0"
              style={{ backgroundColor: client.logoUrl ? 'transparent' : (client.color || '#E87722') }}
            >
              {client.logoUrl ? <img src={client.logoUrl} alt={client.name} className="w-full h-full object-contain p-2" /> : getInitials(client.name)}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">{client.name}</h1>
              {client.description && <p className="text-gray-500 text-sm mt-0.5">{client.description}</p>}
              <p className="text-gray-600 text-xs mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
            </div>
            {isAdmin && (
              <button onClick={() => setShowAddProject(true)} className="btn-primary ml-auto">
                + New Project
              </button>
            )}
          </div>
        )}

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-400 font-medium mb-1">No projects yet</p>
            {isAdmin && (
              <button onClick={() => setShowAddProject(true)} className="text-[#E87722] hover:text-[#E87722] text-sm mt-2 transition-colors">
                + Create first project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <Link
                key={project.id}
                to={`/clients/${clientId}/projects/${project.id}`}
                className="card p-5 hover:border-[#2a3d4f] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 block group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: project.color || '#4D7FA3' }}
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 group-hover:text-gray-400 transition-colors">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                <h3 className="font-display font-bold text-white group-hover:text-[#E87722] transition-colors mb-1">{project.name}</h3>
                {project.description && <p className="text-gray-500 text-xs line-clamp-2">{project.description}</p>}
                {project.createdAt && (
                  <p className="text-gray-600 text-xs mt-3">
                    Created {formatDate(project.createdAt?.toDate?.().toISOString().split('T')[0])}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add project modal */}
      <Modal open={showAddProject} onClose={() => setShowAddProject(false)} title="New Project">
        <form onSubmit={handleAddProject} className="space-y-4">
          <div>
            <label className="label block mb-1.5">Project Name *</label>
            <input
              autoFocus
              value={newProject.name}
              onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
              className="input-field"
              placeholder="e.g. Q2 Blog Content"
              required
            />
          </div>
          <div>
            <label className="label block mb-1.5">Description (optional)</label>
            <textarea
              value={newProject.description}
              onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="Brief description of this project..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create Project'}
            </button>
            <button type="button" onClick={() => setShowAddProject(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
