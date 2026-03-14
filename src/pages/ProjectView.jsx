import { useState, useEffect } from 'react'
import { useParams, useOutletContext, Link } from 'react-router-dom'
import { doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/layout/TopBar'
import GroupSection from '../components/project/GroupSection'
import CardView from '../components/project/CardView'
import Modal from '../components/modals/Modal'

const GROUP_COLORS = ['#E87722','#4D7FA3','#2D5F7E','#C9621A','#6495B8','#22c55e','#F08D40','#1E3D5A']

export default function ProjectView() {
  const { clientId, projectId } = useParams()
  const { onMenuToggle } = useOutletContext()
  const { isStaff } = useAuth()
  const [project, setProject] = useState(null)
  const [client, setClient] = useState(null)
  const [groups, setGroups] = useState([])
  const [view, setView] = useState('list') // 'list' | 'card'
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'clients', clientId), s => {
      if (s.exists()) setClient({ id: s.id, ...s.data() })
    })
    return unsub
  }, [clientId])

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'clients', clientId, 'projects', projectId), s => {
      if (s.exists()) setProject({ id: s.id, ...s.data() })
    })
    return unsub
  }, [clientId, projectId])

  useEffect(() => {
    const q = query(
      collection(db, 'clients', clientId, 'projects', projectId, 'groups'),
      orderBy('createdAt')
    )
    return onSnapshot(q, snap => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [clientId, projectId])

  async function handleAddGroup(e) {
    e.preventDefault()
    if (!newGroupName.trim()) return
    setSaving(true)
    try {
      await addDoc(
        collection(db, 'clients', clientId, 'projects', projectId, 'groups'),
        {
          name: newGroupName.trim(),
          color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
          createdAt: serverTimestamp(),
        }
      )
      setShowAddGroup(false)
      setNewGroupName('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar
        onMenuToggle={onMenuToggle}
        title={project?.name || 'Loading...'}
        subtitle={client?.name}
        logo={client?.logoUrl}
        logoAlt={client?.name}
      />

      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-white transition-colors">Dashboard</Link>
          <span>/</span>
          <Link to={`/clients/${clientId}`} className="hover:text-white transition-colors">{client?.name}</Link>
          <span>/</span>
          <span className="text-white">{project?.name}</span>
        </nav>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 text-sm"
              placeholder="Search items..."
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex bg-[#0f1519] border border-[#1e2d3a] rounded-lg p-1 gap-1">
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-[#E87722]/20 text-[#E87722]' : 'text-gray-500 hover:text-white'}`}
              title="List view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button
              onClick={() => setView('card')}
              className={`p-2 rounded-md transition-colors ${view === 'card' ? 'bg-[#E87722]/20 text-[#E87722]' : 'text-gray-500 hover:text-white'}`}
              title="Board view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>

          {/* Add group button */}
          {isStaff && view === 'list' && (
            <button onClick={() => setShowAddGroup(true)} className="btn-primary">
              + Add Group
            </button>
          )}
        </div>

        {/* Empty state */}
        {groups.length === 0 && (
          <div className="card p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#E87722]/10 border border-[#E87722]/30 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E87722" strokeWidth="1.5">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>
              </svg>
            </div>
            <p className="text-gray-300 font-display font-bold text-lg mb-1">Empty project</p>
            <p className="text-gray-500 text-sm mb-4">Add a group to start organizing your work.</p>
            {isStaff && (
              <button onClick={() => setShowAddGroup(true)} className="btn-primary">
                + Create First Group
              </button>
            )}
          </div>
        )}

        {/* List view */}
        {view === 'list' && groups.length > 0 && (
          <div>
            {groups.map(group => (
              <GroupSection
                key={group.id}
                group={group}
                clientId={clientId}
                projectId={projectId}
                searchFilter={search}
              />
            ))}
          </div>
        )}

        {/* Card / Board view */}
        {view === 'card' && groups.length > 0 && (
          <CardView groups={groups} clientId={clientId} projectId={projectId} />
        )}
      </div>

      {/* Add group modal */}
      <Modal open={showAddGroup} onClose={() => setShowAddGroup(false)} title="New Group" size="sm">
        <form onSubmit={handleAddGroup} className="space-y-4">
          <div>
            <label className="label block mb-1.5">Group Name *</label>
            <input
              autoFocus
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              className="input-field"
              placeholder="e.g. Pre-Production, Week 1, Blog Posts..."
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create Group'}
            </button>
            <button type="button" onClick={() => setShowAddGroup(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
