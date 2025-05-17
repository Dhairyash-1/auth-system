import axios from "axios"

export async function getLocationFromIP(ip?: string) {
  if (!ip) return null
  try {
    const response = await axios.get(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city`
    )
    if (response.data.status === "success") {
      return {
        country: response.data.country,
        region: response.data.regionName,
        city: response.data.city,
      }
    }
    return null
  } catch {
    return null
  }
}
