import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import Button from "../components/Button"
import { useAuth } from "../context/useAuth"
import {
  disable2FA,
  getAllSessions,
  logoutUser,
  request2FASetup,
} from "../api/auth"
import { toast } from "react-toastify"
import { timeSince } from "../utils"

interface Session {
  id: string
  createdAt: string
  lastActive: string
  deviceInfo: {
    browser: string
    os: string
    deviceType: string
    ipAddress: string
    location?: string
  }
  isCurrent: boolean
}
interface UserMetaData {
  passwordChangedAt: Date
  isTwoFactorEnabled: boolean
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [userData, setUserData] = useState<UserMetaData | null>(null)
  const [logoutSessionId, setLogoutSessionId] = useState<string | null>(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await getAllSessions()
        setSessions(response.data.sessions)
        setUserData(response.data.userMetaData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  const handleLogout = async () => {
    try {
      await logoutUser({})
      // clear the context
      logout()
      navigate("/login")
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        "Something went wrong. Please try again"
      toast.error(msg, { autoClose: 3000 })
      console.error(error)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    try {
      setLogoutSessionId(sessionId)

      const isCurrent = sessions.find((s) => s.id === sessionId)?.isCurrent
      if (isCurrent) {
        handleLogout()
      }

      await logoutUser({ sessionId: sessionId })

      // Filter out the terminated session
      setSessions((prev) => prev.filter((session) => session.id !== sessionId))

      // If current session is terminated, redirect to login
      if (sessions.find((s) => s.id === sessionId)?.isCurrent) {
        navigate("/login")
      }
    } catch (error) {
      console.error("Error terminating session:", error)
    } finally {
      setLogoutSessionId(null)
    }
  }

  const handleLogoutAllOtherSessions = async () => {
    try {
      setIsLoading(true)

      await logoutUser({ terminateAllOtherSession: true })

      // Keep only the current session
      setSessions((prev) => prev.filter((session) => session.isCurrent))
    } catch (error) {
      console.error("Error logging out other sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTwoFactorRequest = async () => {
    try {
      if (!userData?.isTwoFactorEnabled) {
        const data = await request2FASetup()
        const { qrcodeUrl, secret } = data?.data
        toast.success("2FA setup initiated. Scan the QR code.")
        navigate("/enable-2fa", {
          state: { otpauthUrl: qrcodeUrl, base32Secret: secret },
        })
      } else {
        await disable2FA()
        setUserData((prev) =>
          prev ? { ...prev, isTwoFactorEnabled: false } : prev
        )
        toast.success("2FA disabled successfully.")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error("2FA request error:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4  sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-3 text-lg font-medium text-gray-700">
            Loading your dashboard...
          </span>
        </div>
      </div>
    )
  }

  const currentSession = sessions.find((session) => session.isCurrent)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="ml-3 text-xl font-semibold text-gray-900">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center">
            <div className="mr-4 text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="relative">
              <Button variant="secondary" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            {/* Current Session Section */}
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Current Session
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Details about your current login session.
                </p>
              </div>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {currentSession && (
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                            Active
                          </span>
                          {currentSession.deviceInfo.browser} on{" "}
                          {currentSession.deviceInfo.os}
                        </h4>
                        <div className="mt-4 grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Device
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              {currentSession.deviceInfo.deviceType}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              IP Address
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              {currentSession.deviceInfo.ipAddress}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Location
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              {currentSession.deviceInfo.location}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Login Time
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              {formatDate(currentSession.createdAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Last Activity
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              {formatDate(currentSession.lastActive)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden sm:block" aria-hidden="true">
            <div className="py-5">
              <div className="border-t border-gray-200"></div>
            </div>
          </div>

          {/* Active Sessions Section */}
          <div className="md:grid md:grid-cols-3 md:gap-6 mt-8">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  All Active Sessions
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  View and manage all of your active login sessions across
                  different devices.
                </p>
                {sessions.length > 1 && (
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      onClick={handleLogoutAllOtherSessions}
                      isLoading={isLoading}
                    >
                      Sign out from all other devices
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {sessions.length === 0 ? (
                    <li className="px-6 py-4 text-sm text-gray-500">
                      No active sessions found.
                    </li>
                  ) : (
                    sessions.map((session) => (
                      <li key={session.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                {session.deviceInfo.deviceType === "Mobile" ? (
                                  <svg
                                    className="h-6 w-6 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="h-6 w-6 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {session.deviceInfo.browser} on{" "}
                                    {session.deviceInfo.os}
                                  </h4>
                                  {session.isCurrent && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center text-xs text-gray-500">
                                  <p>
                                    {session.deviceInfo.location} • IP:{" "}
                                    {session.deviceInfo.ipAddress}
                                  </p>
                                </div>
                                <div className="mt-1 flex items-center text-xs text-gray-500">
                                  <p>
                                    Login: {formatDate(session.createdAt)} •
                                    Last active:{" "}
                                    {formatDate(session.lastActive)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <Button
                              variant="danger"
                              onClick={() => handleTerminateSession(session.id)}
                              isLoading={logoutSessionId === session.id}
                              disabled={logoutSessionId !== null}
                            >
                              {session.isCurrent ? "Sign out" : "Terminate"}
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="hidden sm:block" aria-hidden="true">
            <div className="py-5">
              <div className="border-t border-gray-200"></div>
            </div>
          </div>

          {/* Account Security Section */}
          <div className="md:grid md:grid-cols-3 md:gap-6 mt-8">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Account Security
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your account security settings.
                </p>
              </div>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Password
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Last changed{" "}
                        {timeSince(
                          new Date(userData?.passwordChangedAt as Date)
                        )}
                      </p>
                      <div className="mt-2">
                        <Link to="/change-password">
                          <Button variant="secondary" size="sm">
                            Change password
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Two-factor authentication
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {userData?.isTwoFactorEnabled
                          ? "Enabled"
                          : "Not enabled"}
                      </p>
                      <div className="mt-2">
                        <Button
                          variant="secondary"
                          onClick={handleTwoFactorRequest}
                          size="sm"
                        >
                          {userData?.isTwoFactorEnabled
                            ? "Disable 2FA"
                            : "Enable 2FA"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
