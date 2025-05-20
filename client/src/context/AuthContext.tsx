import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { getCurrentUserSession } from "../api/auth"

interface User {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: Error | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  refreshSession: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
export default AuthContext

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const isAuthenticated = !!user && typeof user.id === "string"

  const refreshSession = async () => {
    try {
      setLoading(true)
      const res = await getCurrentUserSession()
      setUser(res.data)
      setError(null)
    } catch (err) {
      setUser(null)
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    console.log("🔥 getCurrentUserSession API called")
    refreshSession()
  }, [])

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        setUser,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
