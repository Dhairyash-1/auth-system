import jwt, { Secret } from "jsonwebtoken"
import prisma from "../generated"

const JWT_SECRET = process.env.JWT_SECRET! as Secret

if (!JWT_SECRET) throw new Error("JWT_SECRET is missing")

export const generateAccessAndRefreshToken = async (
  userId: string,
  sessionId: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) throw new Error("User not found")

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, sessionId },
    JWT_SECRET,
    {
      expiresIn: (process.env.JWT_ACCESS_EXPIRY ||
        "15m") as jwt.SignOptions["expiresIn"],
    }
  )

  const refreshToken = jwt.sign({ id: userId, sessionId }, JWT_SECRET, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRY ||
      "7d") as jwt.SignOptions["expiresIn"],
  })

  return { accessToken, refreshToken }
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET)
}
