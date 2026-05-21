import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

type Props = {
  children: React.ReactNode
}

// Protege les routes admin : il faut un token ET role === "admin".
// On attend la fin du chargement du profil pour ne pas rediriger a tort.
function AdminRoute({ children }: Props) {
  const { user, isLoading } = useAuth()
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center font-mono text-[11px] text-mute">
        Chargement…
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

export default AdminRoute
