import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#E87722]/30 border-t-[#E87722] rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
