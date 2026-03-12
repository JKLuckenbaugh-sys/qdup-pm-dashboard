import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'
import ItemDetailModal from '../modals/ItemDetailModal'
import { STATUSES, getStatusConfig, getInitials, getAvatarColor, formatDate, isOverdue } from '../../utils/constants'

export default function CardView({ groups, clientId, projectId }) {
  const [allItems, setAllItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (!groups.length) return

    const unsubscribers = []
    const itemsByGroup = {}

    groups.forEach(group => {
      const q = query(
        collection(db, `clients/${clientId}/projects/${projectId}/groups/${group.id}/items`),
        orderBy('createdAt')
      )
      const unsub = onSnapshot(q, snap => {
        itemsByGroup[group.id] = snap.docs.map(d => ({
          id: d.id,
          groupId: group.id,
          groupName: group.name,
          ...d.data(),
        }))
        setAllItems(Object.values(itemsByGroup).flat())
      })
      unsubscribers.push(unsub)
    })

    return () => unsubscribers.forEach(u => u())
  }, [groups, clientId, projectId])

  const filtered = filterStatus === 'all'
    ? allItems
    : allItems.filter(i => i.status === filterStatus)

  const byStatus = {}
  STATUSES.forEach(s => {
    byStatus[s.value] = filtered.filter(i => i.status === s.value)
  })

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterStatus('all')}
          className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
            filterStatus === 'all' ? 'bg-[#E87722]/20 text-[#E87722] border border-[#E87722]/30' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          All ({allItems.length})
        </button>
        {STATUSES.map(s => {
          const count = allItems.filter(i => i.status === s.value).length
          if (count === 0) return null
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filterStatus === s.value ? `${s.color}` : 'text-gray-400 hover:text-white bg-white/5'
              }`}
            >
              {s.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Kanban columns - horizontal scroll on mobile */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map(status => {
          const statusItems = byStatus[status.value] || []
          if (statusItems.length === 0 && filterStatus !== 'all') return null

          return (
            <div key={status.value} className="flex-shrink-0 w-72">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.dot }} />
                <span className="text-sm font-medium text-gray-300">{status.label}</span>
                <span className="text-xs text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full ml-auto">{statusItems.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {statusItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    status={status}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}

                {statusItems.length === 0 && (
                  <div className="border-2 border-dashed border-[#1e2d3a] rounded-xl p-6 text-center">
                    <p className="text-gray-600 text-xs">Empty</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Item detail modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          clientId={clientId}
          projectId={projectId}
          groupId={selectedItem.groupId}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}

function ItemCard({ item, status, onClick }) {
  const overdue = isOverdue(item.dueDate) && item.status !== 'done'

  return (
    <div
      onClick={onClick}
      className="bg-[#0f1519] border border-[#1e2d3a] hover:border-[#2a3d4f] rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 group"
    >
      {/* Content type tag */}
      {item.contentType && (
        <div className="text-xs text-gray-600 mb-2 font-medium">{item.contentType}</div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-gray-100 leading-snug mb-3 group-hover:text-white transition-colors">
        {item.title}
      </p>

      {/* Group tag */}
      <div className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full inline-block mb-3">
        {item.groupName}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Assignee */}
        {item.assignee ? (
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-black"
              style={{ backgroundColor: getAvatarColor(item.assignee) }}
            >
              {getInitials(item.assignee)}
            </div>
            <span className="text-xs text-gray-500">{item.assignee.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        )}

        {/* Due date */}
        {item.dueDate && (
          <span className={`text-xs font-mono ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
            {overdue ? '⚠ ' : ''}{formatDate(item.dueDate)}
          </span>
        )}
      </div>
    </div>
  )
}
