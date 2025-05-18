import { Router } from "express"
import {
  changePassword,
  disable2FA,
  generate2FASecret,
  getAllSessions,
  getCurrentLoggedInUser,
  githubOauthCallback,
  googleOauthCallback,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verify2FA,
  verify2FADuringLogin,
} from "../controllers/user.controller"
import { authMiddleware } from "../middleware/auth.middleware"
import passport from "passport"
import {
  globalLimiter,
  loginLimiter,
  passwordResetLimiter,
} from "../middleware/rateLimiters"

const router = Router()

router.use(globalLimiter)

router.route("/register").post(registerUser)
router.route("/login").post(loginLimiter, loginUser)
router
  .route("/forgot-password")
  .post(passwordResetLimiter, requestPasswordReset)
router.route("/reset-password").post(passwordResetLimiter, resetPassword)
router.route("/refresh-token").post(refreshAccessToken)

// protected routes

router.route("/logout").post(authMiddleware, logoutUser)
router.route("/me").get(authMiddleware, getCurrentLoggedInUser)
router.route("/sessions").get(authMiddleware, getAllSessions)
router.route("/change-password").post(authMiddleware, changePassword)

// Oauth routes

// google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
)
router.get("/google/callback", googleOauthCallback)

// github
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
)
router.get("/github/callback", githubOauthCallback)

// 2FA setup

router.route("/2fa/setup").post(authMiddleware, generate2FASecret)
router.route("/2fa/verify").post(authMiddleware, verify2FA)
router.route("/2fa/disable").post(authMiddleware, disable2FA)

// while login 2fa verification
router.route("/2fa/login").post(loginLimiter, verify2FADuringLogin)

export default router
