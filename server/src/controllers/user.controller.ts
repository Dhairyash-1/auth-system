import prisma from "../generated"
import { comparePassword, hashPassword } from "../services/hash"
import { generateAccessAndRefreshToken } from "../services/jwt"
import { CustomRequest } from "../types"
import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { asyncHandler } from "../utils/asyncHandler"
import { parseDeviceInfo } from "../utils/deviceInfo"
import { validateRequest } from "../utils/validateRequest"
import { loginSchema, registerSchema } from "../utils/validation"

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
  const { email, password, rememberMe } = parsedData

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new ApiError(404, "User does not exist.")
  }

  const isPasswordValid = await comparePassword(password, user.password)
  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect password.")
  }

  const userAgent = req.get("User-Agent") || ""
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    ""

  const deviceInfo = parseDeviceInfo(userAgent, ip)

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      userAgent: req.get("User-Agent") || "",
      ip: deviceInfo.ipAddress,
      browser: deviceInfo.browser,
      deviceType: deviceInfo.deviceType,
      location: deviceInfo.location,
      os: deviceInfo.os,
      refreshToken: "", // temp empty, will update in next step
    },
  })

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user.id,
    session.id
  )

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken },
  })

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
  }

  const { password: _, ...userWithoutPassword } = user

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(200, userWithoutPassword, "User LoggedIn Successfully")
    )
})

// logout the user

export const logoutUser = asyncHandler(async (req: CustomRequest, res) => {
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

export const getAllSessions = asyncHandler(async (req: CustomRequest, res) => {
  const userId = req.user?.id
  const currentSessionId = req.user?.sessionId

  if (!userId) throw new ApiError(401, "Unauthorized request")

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  const sessionInfo = sessions.map((session) => ({
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
  }))

  return res.json(
    new ApiResponse(200, sessionInfo, "Active sessions fetched successfully")
  )
})

// getCurrentLoggedInUser

export const getCurrentLoggedInUser = asyncHandler(
  async (req: CustomRequest, res) => {
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
