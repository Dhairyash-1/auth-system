import { Navigate } from "react-router"
import { useAuth } from "../context/useAuth"
import type { JSX } from "react"
import Loader from "./Loader"

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth()
  console.log(loading, isAuthenticated)

  if (!isAuthenticated && !loading) return <Navigate to="/login" />
  if (loading) return <Loader />

  return children
}

export default ProtectedRoute
