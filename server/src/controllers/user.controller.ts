import passport from "passport"
import speakeasy from "speakeasy"
import qrcode from "qrcode"
import prisma from "../generated"
import { comparePassword, hashPassword } from "../services/hash"
import { CustomRequest } from "../types"
import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { asyncHandler } from "../utils/asyncHandler"
import { createUserSession } from "../utils/authService"
import { validateRequest } from "../utils/validateRequest"
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "../utils/validation"
import crypto from "crypto"
import { sendPasswordResetEmail } from "../utils/sendEmail"
import { generateToken, verifyToken } from "../services/jwt"
import { JwtPayload } from "jsonwebtoken"
import { handleLoginSuccess } from "../utils/handleLoginSuccess"

// register user controller
export const registerUser = asyncHandler(async (req, res) => {
  const parsedData = validateRequest(registerSchema, req.body)

  const { email, password, firstName, lastName } = parsedData

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (existingUser) {
    throw new ApiError(409, "User with Email Already exist.")
  }
  const encryptedPass = await hashPassword(password)

  const newUser = await prisma.user.create({
    data: {
      email,
      password: encryptedPass,
      firstName,
      lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return res.json(new ApiResponse(201, newUser, "User registered successfully"))
})

// login user controller
export const loginUser = asyncHandler(async (req, res) => {
  const parsedData = validateRequest(loginSchema, req.body)
  const { email, password, rememberMe = false } = parsedData

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new ApiError(404, "User does not exist.")
  }

  if (user && user.provider !== "email") {
    throw new ApiError(403, `Please log in using ${user.provider}.`)
  }

  const isPasswordValid = await comparePassword(password, user.password)
  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect password.")
  }

  if (user.isTwoFactorEnabled && user.twoFactorSecret) {
    const tempToken = generateToken(
      { id: user.id },
      process.env.TEMP_2FA_SECRET!,
      "5m"
    )
    return res.json(new ApiResponse(200, { tempToken }, "2FA is required"))
  }

  // Manages session creation, token issuance, cookie setup, and final login response
  await handleLoginSuccess({ user, rememberMe, req, res })
})

// logout the user

export const logoutUser = asyncHandler<CustomRequest>(async (req, res) => {
  const userId = req?.user?.id
  const currentSessionId = req?.user?.sessionId
  const { sessionId, terminateAllOtherSession } = req.body || {}

  if (sessionId) {
    //  logout from a specific session (e.g., other device)
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    })

    if (!session || session.userId !== userId) {
      throw new ApiError(404, "Session not found or unauthorized")
    }

    await prisma.session.delete({ where: { id: sessionId } })

    return res.json(new ApiResponse(200, {}, "Session logged out successfully"))
  } else if (terminateAllOtherSession) {
    await prisma.session.deleteMany({
      where: { userId: userId, id: { not: currentSessionId } },
    })

    return res.json(
      new ApiResponse(200, {}, "All other session terminated successfully")
    )
  } else {
    //  logout current session (this device)
    if (!currentSessionId) {
      throw new ApiError(400, "Current session not found in request")
    }

    await prisma.session.delete({ where: { id: currentSessionId } })

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return res.json(new ApiResponse(200, {}, "Logged out successfully"))
  }
})

// get All user session

export const getAllSessions = asyncHandler<CustomRequest>(async (req, res) => {
  const userId = req.user?.id
  const currentSessionId = req.user?.sessionId

  if (!userId) throw new ApiError(401, "Unauthorized request")

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  const user = await prisma.user.findUnique({ where: { id: userId } })

  const sessionInfo = {
    userMetaData: {
      passwordChangedAt: user?.passwordChangedAt,
      isTwoFactorEnabled: user?.isTwoFactorEnabled,
    },
    sessions: sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      lastActive: session.createdAt,
      deviceInfo: {
        os: session.os,
        browser: session.browser,
        deviceType: session.deviceType,
        location: session.location,
        ipAddress: session.ip,
      },
      isCurrent: session.id === currentSessionId,
    })),
  }

  return res.json(
    new ApiResponse(200, sessionInfo, "Active sessions fetched successfully")
  )
})

// getCurrentLoggedInUser

export const getCurrentLoggedInUser = asyncHandler<CustomRequest>(
  async (req, res) => {
    const email = req?.user?.email
    const id = req?.user?.id
    const sessionId = req?.user?.sessionId
    const session = await prisma.session.findFirst({ where: { id: sessionId } })

    const user = await prisma.user.findFirst({
      where: { id },
      select: {
        createdAt: true,
        email: true,
        firstName: true,
        lastName: true,
        id: true,
        updatedAt: true,
      },
    })

    return res.json(
      new ApiResponse(
        200,
        { ...user, ip: session?.ip, userAgent: session?.userAgent },
        "User session validated"
      )
    )
  }
)

// google Oauth callback
export const googleOauthCallback = asyncHandler(async (req, res, next) => {
  passport.authenticate(
    "google",
    async (
      err: Error | null,
      user: any,
      info: { message?: string } | undefined
    ) => {
      if (err) {
        console.log("Authentication error:", err)
        return next(err)
      }

      if (!user) {
        console.log("No user returned, info:", info)
        return res.redirect(
          `${
            process.env.FRONTEND_REDIRECT_URL as string
          }/login?error=${encodeURIComponent(
            info?.message || "Login Failed using Google"
          )}`
        )
      }

      const userAgent = req.get("User-Agent") || ""
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        ""

      const { accessToken, refreshToken } = await createUserSession(
        user.id,
        userAgent,
        ip
      )

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }

      res.cookie("refreshToken", refreshToken, cookieOptions)
      res.cookie("accessToken", accessToken, cookieOptions)

      res.redirect(process.env.FRONTEND_REDIRECT_URL as string)
    }
  )(req, res, next)
})

// github Oauth callback
export const githubOauthCallback = asyncHandler(async (req, res, next) => {
  passport.authenticate(
    "github",
    async (
      err: Error | null,
      user: any,
      info: { message?: string } | undefined
    ) => {
      if (err) return next(err)

      if (!user) {
        return res.redirect(
          `${
            process.env.FRONTEND_REDIRECT_URL
          }/login?error=${encodeURIComponent(
            info?.message || "Login failed using github"
          )}`
        )
      }

      const userAgent = req.get("User-Agent") || ""
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        ""

      const { accessToken, refreshToken } = await createUserSession(
        user.id,
        userAgent,
        ip
      )

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }

      res
        .cookie("refreshToken", refreshToken, cookieOptions)
        .cookie("accessToken", accessToken, cookieOptions)
        .redirect(process.env.FRONTEND_REDIRECT_URL as string)
    }
  )(req, res, next)
})

// request password reset controller

export const requestPasswordReset = asyncHandler(async (req, res, next) => {
  const { email } = req.body

  const user = await prisma.user.findUnique({ where: { email } })

  if (user && user.provider !== "email") {
    throw new ApiError(
      403,
      `Please login using ${user.provider}, password reset not allowed.`
    )
  }

  if (!user)
    return res.json(new ApiResponse(200, {}, "Email sent if account exist"))

  const rawToken = crypto.randomBytes(32).toString("hex")

  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15) // 15 min

  await prisma.passwordResetToken.create({
    data: {
      email,
      token: hashedToken,
      expiresAt,
    },
  })

  const resetLink = `${process.env.FRONTEND_REDIRECT_URL}/reset-password?token=${rawToken}&email=${email}`

  await sendPasswordResetEmail({
    email,
    name: `${user.firstName} ${user.lastName}`,
    resetLink,
  })

  return res.json(
    new ApiResponse(200, {}, "Reset link sent to email if account exists")
  )
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

  const resetTokenEntry = await prisma.passwordResetToken.findFirst({
    where: {
      email,
      token: hashedToken,
      expiresAt: { gte: new Date() },
    },
  })

  if (!resetTokenEntry) {
    throw new ApiError(400, "Token invalid or expired")
  }

  const hashedPassword = await hashPassword(password)

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword, passwordChangedAt: new Date() },
  })

  await prisma.passwordResetToken.deleteMany({ where: { email } })

  return res.json(new ApiResponse(200, {}, "Password reset successfull"))
})

export const changePassword = asyncHandler<CustomRequest>(async (req, res) => {
  const parsedData = validateRequest(changePasswordSchema, req.body)

  const { password, newPassword } = parsedData
  const currentUserId = req.user?.id
  if (!currentUserId) throw new ApiError(401, "Unauthorized")

  const user = await prisma.user.findUnique({ where: { id: currentUserId } })
  if (!user) throw new ApiError(404, "User not found")

  const isCorrectPassword = await comparePassword(password, user?.password!)
  if (!isCorrectPassword) {
    throw new ApiError(
      401,
      "Current Password is incorrect. password change failed"
    )
  }

  const hashNewPass = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: user?.id },
    data: { password: hashNewPass, passwordChangedAt: new Date() },
  })

  // if password changed then delete all this user session so can login again
  await prisma.session.deleteMany({
    where: { userId: user.id },
  })
  // clear the cookies for current user
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })

  return res.json(new ApiResponse(200, {}, "Password changed successfully"))
})

export const generate2FASecret = asyncHandler<CustomRequest>(
  async (req, res) => {
    const userEmail = req.user?.email

    const secret = speakeasy.generateSecret({
      name: `AuthSystem:${userEmail!}`,
      issuer: "AuthSystem",
    })

    const qrcodeUrl = await qrcode.toDataURL(secret.otpauth_url as string)

    return res.json(
      new ApiResponse(
        200,
        { qrcodeUrl, secret: secret.base32 },
        "2FA secret generated successfully"
      )
    )
  }
)

export const verify2FA = asyncHandler<CustomRequest>(async (req, res) => {
  const { token, secret } = req.body

  if (!token || !secret) {
    throw new ApiError(400, "Token and Secret is required for 2FA verification")
  }

  const isValid = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  })

  if (!isValid) {
    throw new ApiError(400, "Invalid verification code")
  }

  await prisma.user.update({
    where: { id: req.user?.id },
    data: {
      isTwoFactorEnabled: true,
      twoFactorSecret: secret,
    },
  })

  res.json(new ApiResponse(200, {}, "2FA enabled successfully"))
})

export const verify2FADuringLogin = asyncHandler(async (req, res) => {
  const { token: userOtp, tempToken, rememberMe } = req.body

  if (!userOtp) throw new ApiError(400, "TOTP required for 2FA verification")
  if (!tempToken) throw new ApiError(400, "Temp token not found so 2FA failed")

  const payload = verifyToken(
    tempToken,
    process.env.TEMP_2FA_SECRET
  ) as JwtPayload

  if (!payload.id) throw new ApiError(401, "Invaild temp token")

  const user = await prisma.user.findUnique({ where: { id: payload.id } })

  if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
    throw new ApiError(400, "Invalid 2FA state")
  }

  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: userOtp,
    window: 1,
  })

  if (!isValid) {
    throw new ApiError(401, "Invalid 2FA token")
  }

  // Manages session creation, token issuance, cookie setup, and final login response

  await handleLoginSuccess({ user, rememberMe: false, req, res })
})

export const disable2FA = asyncHandler<CustomRequest>(async (req, res) => {
  await prisma.user.update({
    where: { id: req.user?.id },
    data: {
      isTwoFactorEnabled: false,
      twoFactorSecret: "",
    },
  })

  return res.json(new ApiResponse(200, {}, "2FA is diabled successfully"))
})
