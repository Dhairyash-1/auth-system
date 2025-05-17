import { Router } from "express"
import {
  getAllSessions,
  getCurrentLoggedInUser,
  githubOauthCallback,
  googleOauthCallback,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller"
import { authMiddleware } from "../middleware/auth.middleware"
import passport from "passport"

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

// protected routes

router.route("/logout").post(authMiddleware, logoutUser)
router.route("/me").get(authMiddleware, getCurrentLoggedInUser)
router.route("/sessions").get(authMiddleware, getAllSessions)

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

export default router
