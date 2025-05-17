import * as UAParser from "ua-parser-js"
import geoip from "geoip-lite"

interface DeviceInfo {
  browser: string
  os: string
  deviceType: string
  ipAddress: string
  location: string
}

export function parseDeviceInfo(userAgent: string, ip: string): DeviceInfo {
  const parser = new UAParser.UAParser(userAgent)
  const result = parser.getResult()

  const geo = geoip.lookup(ip)

  return {
    browser: `${result.browser.name || "Unknown"} ${
      result.browser.version || ""
    }`.trim(),
    os: `${result.os.name || "Unknown"} ${result.os.version || ""}`.trim(),
    deviceType: result.device.type || "Desktop",
    ipAddress: ip,
    location: geo ? `${geo.city || "Unknown"}, ${geo.country}` : "Unknown",
  }
}
