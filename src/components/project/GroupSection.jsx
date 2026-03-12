import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import ItemRow from './ItemRow'

export default function GroupSection({ group, clientId, projectId }) {
  const { isStaff } = useAuth()
  const [items, setItems] = useState([])
  const [expanded, setExpanded] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const groupPath = `clients/${clientId}/projects/${projectId}/groups/${group.id}`

  useEffect(() => {
    const q = query(collection(db, groupPath, 'items'), orderBy('createdAt'))
    return onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [groupPath])

  async function addItem() {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, groupPath, 'items'), {
        title: newTitle.trim(),
        status: 'not_started',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setNewTitle('')
      setAdding(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function deleteGroup() {
    if (!confirm(`Delete group "${group.name}" and all its items?`)) return
    await deleteDoc(doc(db, `clients/${clientId}/projects/${projectId}/groups`, group.id))
  }

  const doneCount = items.filter(i => i.status === 'done').length
  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-[#1e2d3a] bg-[#0f1519]">
      {/* Group header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-[#0d1520] cursor-pointer select-none group hover:bg-[#1a1a32] transition-colors"
        onClick={() => setExpanded(o => !o)}
      >
        <button className="text-gray-500 hover:text-gray-200 transition-colors flex-shrink-0">
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        {/* Color dot */}
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: group.color || '#E87722' }} />

        <h3 className="font-display font-semibold text-white text-sm flex-1">{group.name}</h3>

        {/* Item count + progress */}
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-16 h-1 bg-[#1e2d3a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E87722] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-mono">{doneCount}/{items.length}</span>
            </div>
          )}
          <span className="text-xs text-gray-600 bg-[#1a2530] px-2 py-0.5 rounded-full">{items.length} items</span>
        </div>

        {/* Group actions */}
        {isStaff && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setAdding(true); setExpanded(true) }}
              className="text-gray-500 hover:text-[#E87722] p-1 rounded transition-colors"
              title="Add item"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
            <button onClick={deleteGroup} className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors" title="Delete group">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Column headers */}
      {expanded && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1a2530]">
          <div className="w-5 flex-shrink-0" />
          <div className="label flex-1">Task</div>
          <div className="label hidden md:block w-28 flex-shrink-0">Assigned</div>
          <div className="label w-28 flex-shrink-0">Status</div>
          <div className="label hidden lg:block w-24 flex-shrink-0 text-right">Due</div>
          <div className="w-5 flex-shrink-0" />
        </div>
      )}

      {/* Items */}
      {expanded && (
        <div>
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              clientId={clientId}
              projectId={projectId}
              groupId={group.id}
            />
          ))}

          {items.length === 0 && !adding && (
            <div className="py-8 text-center">
              <p className="text-gray-600 text-sm">No items in this group</p>
              {isStaff && (
                <button onClick={() => setAdding(true)} className="text-[#E87722] hover:text-[#E87722] text-sm mt-2 transition-colors">
                  + Add first item
                </button>
              )}
            </div>
          )}

          {/* Add item form */}
          {adding && (
            <div className="flex gap-2 p-3 border-t border-[#1a2530] bg-[#0a1018]">
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addItem()
                  if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
                }}
                className="input-field flex-1 text-sm"
                placeholder="Item title... (Enter to save, Esc to cancel)"
              />
              <button onClick={addItem} disabled={saving} className="btn-primary flex-shrink-0 text-xs">
                {saving ? '...' : 'Add'}
              </button>
              <button onClick={() => { setAdding(false); setNewTitle('') }} className="btn-ghost flex-shrink-0 text-xs">
                Cancel
              </button>
            </div>
          )}

          {/* Add item button */}
          {isStaff && !adding && items.length > 0 && (
            <button
              onClick={() => setAdding(true)}
              className="w-full text-left px-4 py-2.5 text-gray-600 hover:text-gray-400 text-xs transition-colors hover:bg-white/[0.02] border-t border-[#1a2530]"
            >
              + Add item
            </button>
          )}
        </div>
      )}
    </div>
  )
}
