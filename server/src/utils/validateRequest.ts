import { ZodSchema } from "zod"
import { ApiError } from "./ApiError"

export function validateRequest<T>(schema: ZodSchema<T>, data: unknown): T {
  if (
    data === null ||
    data === undefined ||
    (typeof data === "object" && Object.keys(data).length === 0)
  ) {
    throw new ApiError(400, "All fields are required")
  }
  const result = schema.safeParse(data)

  if (!result.success) {
    const message = result.error.issues[0]?.message || "Invalid input provided"
    throw new ApiError(400, message)
  }

  return result.data
}
