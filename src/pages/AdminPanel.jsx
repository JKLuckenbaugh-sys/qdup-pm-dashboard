import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, setDoc, serverTimestamp, doc, updateDoc, deleteDoc
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/layout/TopBar'
import Modal from '../components/modals/Modal'
import { getInitials, getAvatarColor } from '../utils/constants'

const CLIENT_COLORS = ['#E87722','#4D7FA3','#2D5F7E','#C9621A','#6495B8','#22c55e','#F08D40']

export default function AdminPanel() {
  const { onMenuToggle } = useOutletContext()
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [clients, setClients] = useState([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('name'))
    return onSnapshot(q, snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('name'))
    return onSnapshot(q, snap => setClients(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Access denied — Admins only.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <TopBar onMenuToggle={onMenuToggle} title="Admin" subtitle="Manage your team and clients" />

      <div className="px-4 lg:px-8 py-8 max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#1e2d3a] mb-8">
          {['users', 'clients'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
                tab === t
                  ? 'border-[#E87722] text-[#E87722]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {t === 'users' ? `Team (${users.length})` : `Clients (${clients.length})`}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-white text-base">Team Members</h2>
              <button onClick={() => setShowAddUser(true)} className="btn-primary text-xs">
                + Invite Member
              </button>
            </div>
            <div className="space-y-2">
              {users.map(u => (
                <UserRow key={u.id} user={u} clients={clients} />
              ))}
            </div>
          </div>
        )}

        {/* Clients tab */}
        {tab === 'clients' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-white text-base">Clients</h2>
              <button onClick={() => setShowAddClient(true)} className="btn-primary text-xs">
                + New Client
              </button>
            </div>
            <div className="space-y-2">
              {clients.map(c => (
                <ClientRow key={c.id} client={c} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddUserModal open={showAddUser} onClose={() => setShowAddUser(false)} clients={clients} />
      <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} clientCount={clients.length} />
    </div>
  )
}

function UserRow({ user, clients }) {
  const [editing, setEditing] = useState(false)
  const [role, setRole] = useState(user.role)
  const [clientId, setClientId] = useState(user.clientId || '')
  const { profile } = useAuth()

  async function saveRole() {
    await updateDoc(doc(db, 'users', user.id), {
      role,
      clientId: role === 'client' ? clientId : null,
    })
    setEditing(false)
  }

  async function sendReset() {
    await sendPasswordResetEmail(auth, user.email)
    alert(`Password reset email sent to ${user.email}`)
  }

  return (
    <div className="card p-4 flex items-center gap-4">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-black flex-shrink-0"
        style={{ backgroundColor: getAvatarColor(user.name || '') }}
      >
        {getInitials(user.name || user.email || '?')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{user.name || '—'}</p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>

      {editing ? (
        <div className="flex items-center gap-2 flex-wrap">
          <select value={role} onChange={e => setRole(e.target.value)} className="input-field text-xs py-1.5 w-28">
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="client">Client</option>
          </select>
          {role === 'client' && (
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="input-field text-xs py-1.5 w-36">
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button onClick={saveRole} className="btn-primary text-xs py-1.5">Save</button>
          <button onClick={() => setEditing(false)} className="btn-ghost text-xs py-1.5">Cancel</button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${
            user.role === 'admin' ? 'bg-[#E87722]/20 text-[#E87722]' :
            user.role === 'staff' ? 'bg-blue-500/20 text-blue-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {user.role}
          </span>
          {user.id !== profile?.id && (
            <>
              <button onClick={() => setEditing(true)} className="text-gray-500 hover:text-white text-xs transition-colors">Edit</button>
              <button onClick={sendReset} className="text-gray-500 hover:text-[#E87722] text-xs transition-colors">Reset PW</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ClientRow({ client }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: client.name, description: client.description || '', logoUrl: client.logoUrl || '' })
  const [saving, setSaving] = useState(false)

  async function deleteClient() {
    if (!confirm(`Delete client "${client.name}"? This won't delete projects inside.`)) return
    await deleteDoc(doc(db, 'clients', client.id))
  }

  async function saveClient() {
    setSaving(true)
    await updateDoc(doc(db, 'clients', client.id), {
      name: form.name.trim(),
      description: form.description.trim(),
      logoUrl: form.logoUrl.trim(),
    })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="card p-4">
      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="label block mb-1">Client Name</label>
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input-field" />
          </div>
          <div>
            <label className="label block mb-1">Logo URL</label>
            <input value={form.logoUrl} onChange={e => setForm(f => ({...f, logoUrl: e.target.value}))} className="input-field" placeholder="https://example.com/logo.png" />
            {form.logoUrl && <img src={form.logoUrl} alt="preview" className="mt-2 h-10 object-contain rounded" />}
          </div>
          <div>
            <label className="label block mb-1">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="input-field" placeholder="Optional note" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveClient} disabled={saving} className="btn-primary text-xs">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setEditing(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black flex-shrink-0 overflow-hidden" style={{ backgroundColor: client.logoUrl ? 'transparent' : (client.color || '#E87722') }}>
            {client.logoUrl ? <img src={client.logoUrl} alt={client.name} className="w-full h-full object-contain p-0.5" /> : getInitials(client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{client.name}</p>
            {client.description && <p className="text-xs text-gray-500 truncate">{client.description}</p>}
          </div>
          <button onClick={() => setEditing(true)} className="text-gray-600 hover:text-[#E87722] text-xs transition-colors">Edit</button>
          <button onClick={deleteClient} className="text-gray-600 hover:text-red-400 text-xs transition-colors">Delete</button>
        </div>
      )}
    </div>
  )
}

function AddUserModal({ open, onClose, clients }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'staff', clientId: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password)
      // Save profile to Firestore using uid as document ID
      await setDoc(doc(db, 'users', user.uid), {
        name: form.name,
        email: form.email,
        role: form.role,
        clientId: form.role === 'client' ? form.clientId : null,
        createdAt: serverTimestamp(),
      })
      onClose()
      setForm({ name: '', email: '', role: 'staff', clientId: '', password: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite Team Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label block mb-1.5">Full Name</label>
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input-field" placeholder="Jane Smith" required />
          </div>
          <div className="col-span-2">
            <label className="label block mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="input-field" placeholder="jane@agency.com" required />
          </div>
          <div className="col-span-2">
            <label className="label block mb-1.5">Temporary Password</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className="input-field" placeholder="Min. 6 characters" required minLength={6} />
          </div>
          <div>
            <label className="label block mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} className="input-field">
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="client">Client</option>
            </select>
          </div>
          {form.role === 'client' && (
            <div>
              <label className="label block mb-1.5">Client Account</label>
              <select value={form.clientId} onChange={e => setForm(f => ({...f, clientId: e.target.value}))} className="input-field" required>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>
        {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Account'}</button>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

function AddClientModal({ open, onClose, clientCount }) {
  const [form, setForm] = useState({ name: '', description: '', logoUrl: '' })
  const [saving, setSaving] = useState(false)
  const COLORS = ['#E87722','#4D7FA3','#2D5F7E','#C9621A','#6495B8','#22c55e','#F08D40']

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addDoc(collection(db, 'clients'), {
        name: form.name.trim(),
        logoUrl: form.logoUrl.trim(),
        description: form.description.trim(),
        color: COLORS[clientCount % COLORS.length],
        createdAt: serverTimestamp(),
      })
      onClose()
      setForm({ name: '', description: '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Client" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label block mb-1.5">Client / Company Name</label>
          <input autoFocus value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input-field" placeholder="Acme Corp" required />
        </div>
        <div>
          <label className="label block mb-1.5">Logo URL (optional)</label>
          <input value={form.logoUrl} onChange={e => setForm(f => ({...f, logoUrl: e.target.value}))} className="input-field" placeholder="https://example.com/logo.png" />
        </div>
        <div>
          <label className="label block mb-1.5">Description (optional)</label>
          <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="input-field" placeholder="Brief note about this client" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Client'}</button>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </Modal>
  )
}
