import rateLimit from "express-rate-limit"
import { ApiError } from "../utils/ApiError"

// Global rate limiter (for all requests)
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: "Too many requests, please try again later.",
  handler: (req, res, next) => {
    const error = new ApiError(
      429,
      "Too many requests, please try again later."
    )
    next(error)
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Login & 2FA limiter
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later.",
  handler: (req, res, next) => {
    const error = new ApiError(
      429,
      "Too many login attempts, please try again later."
    )
    next(error)
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Forgot password & Reset password limiter (same or separate, your choice)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many password reset attempts, please try again later.",
  handler: (req, res, next) => {
    const error = new ApiError(
      429,
      "Too many password reset attempts, please try again later."
    )
    next(error)
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const oauthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    status: 429,
    message: "Too many OAuth requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})
