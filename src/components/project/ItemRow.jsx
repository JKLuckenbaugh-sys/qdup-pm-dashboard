import { useState, useEffect } from 'react'
import { doc, updateDoc, deleteDoc, collection, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import SubItemRow from './SubItemRow'
import ItemDetailModal from '../modals/ItemDetailModal'
import {
  STATUSES, getStatusConfig, getInitials, getAvatarColor, formatDate, isOverdue
} from '../../utils/constants'

export default function ItemRow({ item, clientId, projectId, groupId }) {
  const { isStaff } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [subitems, setSubitems] = useState([])
  const [showDetail, setShowDetail] = useState(false)

  const itemPath = `clients/${clientId}/projects/${projectId}/groups/${groupId}/items/${item.id}`

  useEffect(() => {
    if (!expanded) return
    const q = query(collection(db, itemPath, 'subitems'), orderBy('createdAt'))
    return onSnapshot(q, snap => {
      setSubitems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [expanded, itemPath])

  async function updateStatus(status) {
    await updateDoc(doc(db, itemPath), { status, updatedAt: serverTimestamp() })
  }

  async function remove() {
    if (!confirm(`Delete "${item.title}"?`)) return
    await deleteDoc(doc(db, itemPath))
  }

  const status = getStatusConfig(item.status)
  const overdue = isOverdue(item.dueDate) && item.status !== 'done'

  return (
    <>
      <div className="border-b border-[#1a2530] last:border-0">
        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] group transition-colors cursor-pointer"
          onClick={() => setShowDetail(true)}
        >
          {/* Expand toggle */}
          <button
            onClick={e => { e.stopPropagation(); setExpanded(o => !o) }}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-100 truncate">{item.title}</span>
              {item.contentType && (
                <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full hidden sm:inline">{item.contentType}</span>
              )}
              {overdue && <span className="text-xs text-red-400 hidden sm:inline">⚠ Overdue</span>}
            </div>
          </div>

          {/* Assignee */}
          <div className="hidden md:flex items-center gap-1.5 w-28 flex-shrink-0">
            {item.assignee ? (
              <>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                  style={{ backgroundColor: getAvatarColor(item.assignee) }}
                >
                  {getInitials(item.assignee)}
                </div>
                <span className="text-xs text-gray-400 truncate">{item.assignee}</span>
              </>
            ) : (
              <span className="text-xs text-gray-600">Unassigned</span>
            )}
          </div>

          {/* Status */}
          <div className="flex-shrink-0 w-28" onClick={e => e.stopPropagation()}>
            {isStaff ? (
              <select
                value={item.status}
                onChange={e => updateStatus(e.target.value)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer w-full ${status.color}`}
                style={{ backgroundColor: 'transparent' }}
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value} style={{ color: 'white', background: '#0f1519' }}>
                    {s.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`status-badge ${status.color}`}>{status.label}</span>
            )}
          </div>

          {/* Due date */}
          <div className="hidden lg:block w-24 flex-shrink-0 text-right">
            <span className={`text-xs font-mono ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
              {formatDate(item.dueDate)}
            </span>
          </div>

          {/* Delete */}
          {isStaff && (
            <button
              onClick={e => { e.stopPropagation(); remove() }}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          )}
        </div>

        {/* Subitems */}
        {expanded && (
          <div className="bg-[#0a1018] border-t border-[#1a2530]">
            {subitems.map(sub => (
              <SubItemRow key={sub.id} subitem={sub} itemPath={itemPath} />
            ))}
            {subitems.length === 0 && (
              <p className="text-gray-600 text-xs px-12 py-3">
                No sub-tasks — open item to add some
              </p>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {showDetail && (
        <ItemDetailModal
          item={item}
          clientId={clientId}
          projectId={projectId}
          groupId={groupId}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}
