import { Navigate } from "react-router"
import { useAuth } from "../context/useAuth"
import type { JSX } from "react"

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated === false) return <Navigate to="/login" />
  return children
}

export default ProtectedRoute
