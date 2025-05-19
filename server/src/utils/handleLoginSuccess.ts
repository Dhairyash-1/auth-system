import { Response } from "express"
import { ApiResponse } from "../utils/ApiResponse"
import { createUserSession } from "./authService"
import { User } from "@prisma/client"

type HandleLoginOptions = {
  user: User
  rememberMe: boolean
  req: any
  res: Response
}

export const handleLoginSuccess = async ({
  user,
  rememberMe,
  req,
  res,
}: HandleLoginOptions) => {
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
    ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}), // 30 days
  }

  const { password: _, ...userWithoutPassword } = user

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(200, userWithoutPassword, "User LoggedIn Successfully")
    )
}
