import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios"
import { refreshAccessToken } from "./auth"

interface FailedRequest {
  resolve: (value?: unknown) => void
  reject: (error: unknown) => void
}

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  withCredentials: true,
})
let isRefreshing = false
let failedQueue: FailedRequest[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (
    error: AxiosError & { config: AxiosRequestConfig & { _retry?: boolean } }
  ) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Queue the requests while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (typeof token === "string") {
              originalRequest.headers = originalRequest.headers || {}
              originalRequest.headers["Authorization"] = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const data = await refreshAccessToken()
        const newAccessToken = data.accessToken
        // console.log("refreshing access token", data)

        // Update original request with new token
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`

        processQueue(null, newAccessToken)
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)

        window.location.href = "/login"
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
export default api
