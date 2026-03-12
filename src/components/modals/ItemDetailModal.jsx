import { useState, useEffect } from 'react'
import { doc, updateDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import Modal from './Modal'
import {
  STATUSES, CONTENT_TYPES, APPROVAL_STATUSES, PRIORITIES,
  getStatusConfig, getInitials, getAvatarColor, formatDate, isOverdue
} from '../../utils/constants'

export default function ItemDetailModal({ item, clientId, projectId, groupId, onClose }) {
  const { profile, isStaff, isClient } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [subitems, setSubitems] = useState([])
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [newSubitem, setNewSubitem] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('details')

  const itemPath = `clients/${clientId}/projects/${projectId}/groups/${groupId}/items/${item.id}`

  useEffect(() => {
    setForm({ ...item })
  }, [item])

  // Subitems listener
  useEffect(() => {
    const q = query(collection(db, itemPath, 'subitems'), orderBy('createdAt'))
    return onSnapshot(q, snap => {
      setSubitems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [itemPath])

  // Comments listener
  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt'))
    return onSnapshot(q, snap => {
      setComments(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c => c.itemId === item.id)
      )
    })
  }, [item.id])

  async function handleSave() {
    setSaving(true)
    try {
      await updateDoc(doc(db, itemPath), {
        title: form.title,
        status: form.status,
        contentType: form.contentType,
        assignee: form.assignee,
        dueDate: form.dueDate,
        publishDate: form.publishDate,
        approvalStatus: form.approvalStatus,
        priority: form.priority,
        notes: form.notes,
        fileLinks: form.fileLinks,
        updatedAt: serverTimestamp(),
      })
      setEditing(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddSubitem() {
    if (!newSubitem.trim()) return
    await addDoc(collection(db, itemPath, 'subitems'), {
      title: newSubitem.trim(),
      status: 'not_started',
      createdAt: serverTimestamp(),
    })
    setNewSubitem('')
  }

  async function toggleSubitem(subitem) {
    const newStatus = subitem.status === 'done' ? 'not_started' : 'done'
    await updateDoc(doc(db, itemPath, 'subitems', subitem.id), { status: newStatus })
  }

  async function deleteSubitem(subitemId) {
    await deleteDoc(doc(db, itemPath, 'subitems', subitemId))
  }

  async function handleAddComment() {
    if (!newComment.trim()) return
    await addDoc(collection(db, 'comments'), {
      itemId: item.id,
      text: newComment.trim(),
      authorId: profile.id,
      authorName: profile.name,
      createdAt: serverTimestamp(),
    })
    setNewComment('')
  }

  async function handleClientApprove() {
    await updateDoc(doc(db, itemPath), { approvalStatus: 'approved' })
  }

  const status = getStatusConfig(form.status)
  const overdue = isOverdue(form.dueDate) && form.status !== 'done'

  return (
    <Modal open={true} onClose={onClose} title="" size="xl">
      {/* Item header */}
      <div className="mb-5 -mx-6 -mt-5 px-6 pt-5 pb-4 border-b border-[#1e2d3a]">
        {editing ? (
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="input-field text-lg font-bold font-display w-full"
          />
        ) : (
          <h2 className="font-display font-bold text-white text-xl">{item.title}</h2>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className={`status-badge ${status.color}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
            {status.label}
          </span>
          {item.contentType && (
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">{item.contentType}</span>
          )}
          {overdue && (
            <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full">⚠ Overdue</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 -mx-6 px-6 border-b border-[#1e2d3a] mb-5">
        {['details', 'subitems', 'comments'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              tab === t
                ? 'border-[#E87722] text-[#E87722]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t}
            {t === 'comments' && comments.length > 0 && (
              <span className="ml-1.5 text-xs bg-[#E87722]/20 text-[#E87722] px-1.5 py-0.5 rounded-full">
                {comments.length}
              </span>
            )}
            {t === 'subitems' && subitems.length > 0 && (
              <span className="ml-1.5 text-xs bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-full">
                {subitems.filter(s => s.status === 'done').length}/{subitems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {tab === 'details' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Status">
              {editing ? (
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-field">
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              ) : (
                <span className={`status-badge ${status.color}`}>{status.label}</span>
              )}
            </Field>

            <Field label="Content Type">
              {editing ? (
                <select value={form.contentType || ''} onChange={e => setForm(f => ({ ...f, contentType: e.target.value }))} className="input-field">
                  <option value="">Select type...</option>
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <span className="text-gray-300">{item.contentType || '—'}</span>
              )}
            </Field>

            <Field label="Due Date">
              {editing ? (
                <input type="date" value={form.dueDate || ''} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="input-field" />
              ) : (
                <span className={overdue ? 'text-red-400' : 'text-gray-300'}>{formatDate(item.dueDate)}</span>
              )}
            </Field>

            <Field label="Publish Date">
              {editing ? (
                <input type="date" value={form.publishDate || ''} onChange={e => setForm(f => ({ ...f, publishDate: e.target.value }))} className="input-field" />
              ) : (
                <span className="text-gray-300">{formatDate(item.publishDate)}</span>
              )}
            </Field>

            <Field label="Assigned To">
              {editing ? (
                <input value={form.assignee || ''} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} className="input-field" placeholder="Name" />
              ) : (
                <AssigneeChip name={item.assignee} />
              )}
            </Field>

            <Field label="Priority">
              {editing ? (
                <select value={form.priority || ''} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input-field">
                  <option value="">None</option>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              ) : (
                <PriorityBadge priority={item.priority} />
              )}
            </Field>

            <Field label="Approval Status">
              {editing ? (
                <select value={form.approvalStatus || ''} onChange={e => setForm(f => ({ ...f, approvalStatus: e.target.value }))} className="input-field">
                  {APPROVAL_STATUSES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              ) : (
                <ApprovalBadge status={item.approvalStatus} />
              )}
            </Field>
          </div>

          <Field label="File / Asset Links">
            {editing ? (
              <textarea
                value={form.fileLinks || ''}
                onChange={e => setForm(f => ({ ...f, fileLinks: e.target.value }))}
                className="input-field"
                rows={2}
                placeholder="Paste Google Drive, Canva, or other links (one per line)"
              />
            ) : (
              <div className="space-y-1">
                {item.fileLinks
                  ? item.fileLinks.split('\n').filter(Boolean).map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-[#E87722] hover:text-[#F08D40] text-sm truncate underline-offset-2 hover:underline">
                      {link}
                    </a>
                  ))
                  : <span className="text-gray-500">No files linked</span>
                }
              </div>
            )}
          </Field>

          <Field label="Notes">
            {editing ? (
              <textarea
                value={form.notes || ''}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="input-field"
                rows={4}
                placeholder="Internal notes, context, links..."
              />
            ) : (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{item.notes || <span className="text-gray-500">No notes</span>}</p>
            )}
          </Field>

          {/* Client approval CTA */}
          {isClient && item.approvalStatus === 'submitted' && (
            <div className="bg-[#E87722]/10 border border-[#E87722]/30 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[#F08D40] font-medium text-sm">This content is ready for your review</p>
                <p className="text-gray-400 text-xs mt-0.5">Review the files above and approve or request changes below.</p>
              </div>
              <button onClick={handleClientApprove} className="btn-primary flex-shrink-0">Approve ✓</button>
            </div>
          )}
        </div>
      )}

      {/* Subitems tab */}
      {tab === 'subitems' && (
        <div className="space-y-2">
          {subitems.map(sub => (
            <div key={sub.id} className="flex items-center gap-3 p-3 bg-[#1a1a28] rounded-lg group">
              <button onClick={() => toggleSubitem(sub)} className="flex-shrink-0">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  sub.status === 'done' ? 'bg-green-500 border-green-500' : 'border-[#2a3d4f] hover:border-[#E87722]'
                }`}>
                  {sub.status === 'done' && <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5"><polyline points="2 6 5 9 10 3"/></svg>}
                </div>
              </button>
              <span className={`flex-1 text-sm ${sub.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                {sub.title}
              </span>
              {isStaff && (
                <button onClick={() => deleteSubitem(sub.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              )}
            </div>
          ))}

          {subitems.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-6">No sub-tasks yet</p>
          )}

          {isStaff && (
            <div className="flex gap-2 mt-3">
              <input
                value={newSubitem}
                onChange={e => setNewSubitem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubitem()}
                className="input-field flex-1"
                placeholder="Add a sub-task..."
              />
              <button onClick={handleAddSubitem} className="btn-primary flex-shrink-0">Add</button>
            </div>
          )}
        </div>
      )}

      {/* Comments tab */}
      {tab === 'comments' && (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0 mt-0.5"
                style={{ backgroundColor: getAvatarColor(c.authorName || '') }}
              >
                {getInitials(c.authorName || '?')}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-white">{c.authorName}</span>
                  <span className="text-xs text-gray-500">
                    {c.createdAt?.toDate?.().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || ''}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{c.text}</p>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-6">No comments yet</p>
          )}

          <div className="flex gap-2 mt-4">
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              className="input-field flex-1"
              placeholder="Leave a comment..."
            />
            <button onClick={handleAddComment} className="btn-primary flex-shrink-0">Post</button>
          </div>
        </div>
      )}

      {/* Footer actions */}
      {isStaff && tab === 'details' && (
        <div className="flex gap-2 mt-6 pt-5 border-t border-[#1e2d3a]">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button onClick={() => { setForm({ ...item }); setEditing(false) }} className="btn-ghost">Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-ghost">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label block mb-1.5">{label}</label>
      <div>{children}</div>
    </div>
  )
}

function AssigneeChip({ name }) {
  if (!name) return <span className="text-gray-500">Unassigned</span>
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ backgroundColor: getAvatarColor(name) }}>
        {getInitials(name)}
      </div>
      <span className="text-gray-300 text-sm">{name}</span>
    </div>
  )
}

function PriorityBadge({ priority }) {
  const PRIORITIES = { high: '▲ High', medium: '● Medium', low: '▼ Low' }
  const colors = { high: 'text-red-400', medium: 'text-[#E87722]', low: 'text-gray-500' }
  if (!priority) return <span className="text-gray-500">—</span>
  return <span className={`text-sm font-medium ${colors[priority]}`}>{PRIORITIES[priority]}</span>
}

function ApprovalBadge({ status }) {
  const configs = {
    pending: 'text-gray-400',
    submitted: 'text-[#E87722]',
    approved: 'text-green-400',
    changes: 'text-red-400',
  }
  const labels = { pending: 'Pending', submitted: 'Submitted', approved: 'Approved ✓', changes: 'Changes Requested' }
  if (!status) return <span className="text-gray-500">—</span>
  return <span className={`text-sm font-medium ${configs[status]}`}>{labels[status]}</span>
}
