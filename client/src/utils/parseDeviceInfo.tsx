import * as UAParser from "ua-parser-js"

export function parseDeviceInfo(userAgent: string | undefined) {
  if (!userAgent) return { device: "Unknown", browser: "Unknown" }
  const parser = new UAParser.UAParser(userAgent)
  const deviceType = parser.getDevice().type || "desktop"
  const browserName = parser.getBrowser().name || "Unknown"
  const osName = parser.getOS().name || "Unknown"

  return {
    device: deviceType, // mobile, tablet, desktop, etc
    browser: browserName,
    os: osName,
  }
}
