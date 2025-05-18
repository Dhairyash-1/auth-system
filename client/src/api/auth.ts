import api from "./axios"

interface loginPayload {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
}
interface logoutPayload {
  sessionId?: string
  terminateAllOtherSession?: boolean
}

export const registerUser = async (data: RegisterPayload) => {
  const res = await api.post("/user/register", data)
  return res.data
}

export const loginUser = async (data: loginPayload) => {
  const res = await api.post("/user/login", data)
  // const sessionId = res.data.data.sessionId
  // sessionStorage.setItem("sessionId", sessionId)

  return res.data
}
export const logoutUser = async (data: logoutPayload) => {
  const res = await api.post("/user/logout", data)

  return res.data
}
export const getCurrentUserSession = async () => {
  const res = await api.get("/user/me")

  return res.data
}
export const getAllSessions = async () => {
  const res = await api.get("/user/sessions")

  return res.data
}

export const requestPasswordReset = async (data: { email: string }) => {
  const res = await api.post("/user/forgot-password", data)

  return res.data
}

export const resetPassword = async (data: {
  email: string
  token: string
  password: string
}) => {
  const res = await api.post("/user/reset-password", data)

  return res.data
}
export const changePassword = async (data: {
  password: string
  newPassword: string
}) => {
  const res = await api.post("/user/change-password", data)

  return res.data
}
export const request2FASetup = async () => {
  const res = await api.post("/user/2fa/setup")
  return res.data
}

export const verify2FA = async (data: { token: string; secret: string }) => {
  const res = await api.post("/user/2fa/verify", data)

  return res.data
}
export const disable2FA = async () => {
  const res = await api.post("/user/2fa/disable")

  return res.data
}

export const verify2FADuringLogin = async (data: {
  token: string
  tempToken: string
  rememberMe: boolean
}) => {
  const res = await api.post("/user/2fa/login", data)

  return res.data
}
