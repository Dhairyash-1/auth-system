import { z } from "zod"

export const registerSchema = z.object({
  firstName: z.string().nonempty("firstName is required").trim(),
  lastName: z.string().nonempty("lastName is required").trim(),
  email: z
    .string({ required_error: "Email is required" })
    .nonempty("Email is required")
    .email("Invalid email format")
    .trim()
    .toLowerCase(),

  password: z
    .string({ required_error: "Password is required" })
    .nonempty("Password is required")
    .min(8, "Password must be at least 8 characters")
    .trim(),
})

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .nonempty("Email is required")
    .email("Invalid email format")
    .trim()
    .toLowerCase(),

  password: z
    .string({ required_error: "Password is required" })
    .nonempty("Password is required")
    .trim(),

  rememberMe: z.boolean().optional(),
})

export const changePasswordSchema = z.object({
  password: z
    .string({ required_error: "Current Password is required" })
    .nonempty("Current Password is required")
    .trim(),
  newPassword: z
    .string({ required_error: "New Password is required" })
    .nonempty("New Password is required")
    .min(8, "New Password must be at least 8 characters")
    .trim(),
})
