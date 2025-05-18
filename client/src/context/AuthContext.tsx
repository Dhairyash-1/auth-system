import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import api from "../api/axios"
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
  login: (userData: User) => void
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

  const login = (userData: User) => {
    setUser(userData)
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const response = await getCurrentUserSession()
        setUser(response.data)
        setError(null)
      } catch (err) {
        setUser(null)
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const isAuthenticated = !!user && typeof user.id === "string"

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, error, setUser, logout, login }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}
