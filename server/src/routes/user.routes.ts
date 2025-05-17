import { Router } from "express"
import {
  getAllSessions,
  getCurrentLoggedInUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller"
import { authMiddleware } from "../middleware/auth.middleware"

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

// protected routes

router.route("/logout").post(authMiddleware, logoutUser)
router.route("/me").get(authMiddleware, getCurrentLoggedInUser)
router.route("/sessions").get(authMiddleware, getAllSessions)

export default router
