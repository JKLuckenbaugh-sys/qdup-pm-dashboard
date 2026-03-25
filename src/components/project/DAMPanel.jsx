import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'

const ASSET_TYPES = [
  { key: 'audio', label: 'Audio', icon: '🎵' },
  { key: 'video', label: 'Video', icon: '🎬' },
  { key: 'thumbnail', label: 'Thumbnail', icon: '🖼️' },
  { key: 'transcript', label: 'Transcript', icon: '📄' },
  { key: 'raw_footage', label: 'Raw Footage', icon: '🎥' },
  { key: 'production_package', label: 'Production Package', icon: '📦' },
]

export default function DAMPanel({ open, onClose, group, clientId, projectId }) {
  const { isStaff } = useAuth()
  const [assets, setAssets] = useState([])
  const [adding, setAdding] = useState(null)
  const [form, setForm] = useState({ label: '', url: '' })
  const [copied, setCopied] = useState(null)

  const assetsPath = `clients/${clientId}/projects/${projectId}/groups/${group.id}/assets`

  useEffect(() => {
    if (!open) return
    const unsub = onSnapshot(collection(db, assetsPath), snap => {
      setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [open, assetsPath])

  async function addAsset(type) {
    if (!form.url.trim()) return
    await addDoc(collection(db, assetsPath), {
      type,
      label: form.label.trim() || type,
      url: form.url.trim(),
      createdAt: serverTimestamp(),
    })
    setForm({ label: '', url: '' })
    setAdding(null)
  }

  async function deleteAsset(id) {
    await deleteDoc(doc(db, assetsPath, id))
  }

  function copyUrl(url, id) {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-[#0c1117] border-l border-[#1e2d3a] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e2d3a]">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Files</p>
            <h3 className="font-display font-bold text-white text-sm truncate">{group.name}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Asset categories */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {ASSET_TYPES.map(type => {
            const typeAssets = assets.filter(a => a.type === type.key)
            const isAddingThis = adding === type.key

            return (
              <div key={type.key} className="bg-[#0f1519] rounded-xl border border-[#1e2d3a] overflow-hidden">
                {/* Type header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1e2d3a]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{type.icon}</span>
                    <span className="text-xs font-medium text-white">{type.label}</span>
                    {typeAssets.length > 0 && (
                      <span className="text-xs text-[#E87722] bg-[#E87722]/10 px-1.5 py-0.5 rounded-full">{typeAssets.length}</span>
                    )}
                  </div>
                  {isStaff && (
                    <button
                      onClick={() => setAdding(isAddingThis ? null : type.key)}
                      className="text-gray-600 hover:text-[#E87722] transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Assets list */}
                {typeAssets.map(asset => (
                  <div key={asset.id} className="flex items-center gap-2 px-3 py-2 border-b border-[#1a2530] last:border-0 group">
                    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate hover:text-[#E87722] transition-colors">{asset.label}</p>
                      <p className="text-xs text-gray-600 truncate">{asset.url}</p>
                    </a>
                    <button
                      onClick={() => copyUrl(asset.url, asset.id)}
                      className="text-gray-600 hover:text-white transition-colors flex-shrink-0 p-1"
                      title="Copy URL"
                    >
                      {copied === asset.id ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      )}
                    </button>
                    {isStaff && (
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0 p-1 opacity-0 group-hover:opacity-100"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {/* Add form */}
                {isAddingThis && (
                  <div className="p-3 border-t border-[#1a2530] space-y-2 bg-[#0a1018]">
                    <input
                      autoFocus
                      value={form.label}
                      onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                      className="input-field text-xs w-full"
                      placeholder={`Label (e.g. "Final Audio")`}
                    />
                    <input
                      value={form.url}
                      onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') addAsset(type.key); if (e.key === 'Escape') setAdding(null) }}
                      className="input-field text-xs w-full"
                      placeholder="https://..."
                    />
                    <div className="flex gap-2">
                      <button onClick={() => addAsset(type.key)} className="btn-primary text-xs flex-1">Add</button>
                      <button onClick={() => { setAdding(null); setForm({ label: '', url: '' }) }} className="btn-ghost text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {typeAssets.length === 0 && !isAddingThis && (
                  <p className="text-xs text-gray-700 px-3 py-2">No files yet</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
