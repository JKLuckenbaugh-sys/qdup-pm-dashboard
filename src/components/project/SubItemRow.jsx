import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { getStatusConfig, getInitials, getAvatarColor, formatDate } from '../../utils/constants'
import { STATUSES } from '../../utils/constants'

export default function SubItemRow({ subitem, itemPath }) {
  const { isStaff } = useAuth()

  async function updateStatus(status) {
    await updateDoc(doc(db, itemPath, 'subitems', subitem.id), { status })
  }

  async function remove() {
    if (!confirm('Delete this sub-task?')) return
    await deleteDoc(doc(db, itemPath, 'subitems', subitem.id))
  }

  const status = getStatusConfig(subitem.status)

  return (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/3 group transition-colors">
      {/* Indent spacer */}
      <div className="w-8 flex-shrink-0" />
      <div className="w-3 h-3 flex-shrink-0">
        <div className="w-2 h-2 rounded-full border border-[#2a3d4f] mx-auto" />
      </div>

      {/* Title */}
      <span className={`flex-1 text-sm min-w-0 truncate ${subitem.status === 'done' ? 'line-through text-gray-500' : 'text-gray-300'}`}>
        {subitem.title}
      </span>

      {/* Assignee */}
      <div className="hidden sm:block w-20 flex-shrink-0">
        {subitem.assignee ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ backgroundColor: getAvatarColor(subitem.assignee) }}>
              {getInitials(subitem.assignee)}
            </div>
            <span className="text-xs text-gray-500 truncate">{subitem.assignee}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        )}
      </div>

      {/* Status - compact */}
      <div className="w-24 flex-shrink-0">
        {isStaff ? (
          <select
            value={subitem.status}
            onChange={e => updateStatus(e.target.value)}
            className="bg-transparent text-xs border-0 outline-none cursor-pointer w-full"
            style={{ color: status.dot }}
          >
            {STATUSES.map(s => (
              <option key={s.value} value={s.value} style={{ color: 'white', background: '#0f1519' }}>
                {s.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs" style={{ color: status.dot }}>{status.label}</span>
        )}
      </div>

      {/* Date */}
      <div className="hidden md:block w-24 flex-shrink-0 text-right">
        <span className="text-xs text-gray-500">{formatDate(subitem.dueDate)}</span>
      </div>

      {/* Delete */}
      {isStaff && (
        <button onClick={remove} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      )}
    </div>
  )
}
