import prisma from "../generated/index"
import { generateAccessAndRefreshToken } from "../services/jwt"
import { parseDeviceInfo } from "./deviceInfo"

export async function createUserSession(
  userId: string,
  userAgent: string,
  ip: string
) {
  const deviceInfo = parseDeviceInfo(userAgent, ip)

  const session = await prisma.session.create({
    data: {
      userId,
      userAgent,
      ip: deviceInfo.ipAddress,
      browser: deviceInfo.browser,
      deviceType: deviceInfo.deviceType,
      location: deviceInfo.location,
      os: deviceInfo.os,
      refreshToken: "", // will update later
    },
  })

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    userId,
    session.id
  )

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken },
  })

  return { session, accessToken, refreshToken }
}
