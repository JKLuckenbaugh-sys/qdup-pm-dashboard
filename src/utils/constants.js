export const STATUSES = [
  { value: 'not_started', label: 'Not Started', color: 'bg-[#1e2d3a] text-gray-400', dot: '#4a6070' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-600/20 text-blue-300 border border-blue-500/30', dot: '#3b82f6' },
  { value: 'in_review',   label: 'In Review',   color: 'bg-[#E87722]/20 text-[#F08D40] border border-[#E87722]/30', dot: '#E87722' },
  { value: 'approved',    label: 'Approved',    color: 'bg-[#4D7FA3]/20 text-[#6495B8] border border-[#4D7FA3]/30', dot: '#4D7FA3' },
  { value: 'scheduled',   label: 'Scheduled',   color: 'bg-[#2D5F7E]/30 text-[#6495B8] border border-[#4D7FA3]/30', dot: '#2D7FA3' },
  { value: 'done',        label: 'Done',        color: 'bg-green-600/20 text-green-300 border border-green-500/30', dot: '#22c55e' },
  { value: 'blocked',     label: 'Blocked',     color: 'bg-red-600/20 text-red-300 border border-red-500/30', dot: '#ef4444' },
]

export const CONTENT_TYPES = [
  'Blog Post',
  'Social Media',
  'Video',
  'Email',
  'Newsletter',
  'Podcast',
  'Ad Copy',
  'Website Copy',
  'Case Study',
  'White Paper',
  'Press Release',
  'Other',
]

export const APPROVAL_STATUSES = [
  { value: 'pending',   label: 'Pending',   color: 'text-gray-400' },
  { value: 'submitted', label: 'Submitted', color: 'text-[#E87722]' },
  { value: 'approved',  label: 'Approved',  color: 'text-green-400' },
  { value: 'changes',   label: 'Changes Requested', color: 'text-red-400' },
]

export const PRIORITIES = [
  { value: 'high',   label: 'High',   color: 'text-red-400',   icon: '▲' },
  { value: 'medium', label: 'Medium', color: 'text-[#E87722]', icon: '●' },
  { value: 'low',    label: 'Low',    color: 'text-gray-500',  icon: '▼' },
]

export const AVATAR_COLORS = [
  '#E87722', '#3b82f6', '#8b5cf6', '#06b6d4',
  '#ec4899', '#22c55e', '#f97316', '#14b8a6',
]

export function getStatusConfig(value) {
  return STATUSES.find(s => s.value === value) || STATUSES[0]
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getAvatarColor(name = '') {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}
