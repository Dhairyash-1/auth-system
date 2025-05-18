import jwt, { JwtPayload } from "jsonwebtoken"
import { CustomRequest } from "../types"
import { ApiError } from "../utils/ApiError"
import { asyncHandler } from "../utils/asyncHandler"
import prisma from "../generated"

export const authMiddleware = asyncHandler(
  async (req: CustomRequest, res, next) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "")

    if (!token) throw new ApiError(401, "Unauthorized request")

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload

      const user = await prisma.user.findUnique({ where: { id: decoded.id } })

      if (!user) {
        throw new ApiError(401, "Invalid Access token")
      }

      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
      })

      if (!session || session.userId !== user.id) {
        //  session revoked or invalid → force logout
        res.clearCookie("accessToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })

        throw new ApiError(
          401,
          "Session expired or revoked. Please login again."
        )
      }

      req.user = { id: user.id, email: user.email, sessionId: session.id }
      next()
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new ApiError(401, "Token expired", [], "TOKEN_EXPIRED")
      } else {
        throw new ApiError(401, "Invalid or expired token")
      }
    }
  }
)
