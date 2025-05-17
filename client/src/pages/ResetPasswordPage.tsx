import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useSearchParams } from "react-router"
import type { PasswordResetFormValues } from "../utils/validationSchemas"
import { passwordResetSchema } from "../utils/validationSchemas"
import AuthLayout from "../components/AuthLayout"
import FormInput from "../components/FormInput"
import Button from "../components/Button"
import { resetPassword } from "../api/auth"

const ResetPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Get token from URL query params
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Verify token is present
  if (!token || !email) {
    return (
      <AuthLayout
        showSocialLogin={false}
        title="Invalid reset link"
        description="This password reset link is invalid or has expired"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Please request a new password reset link.
          </p>
          <div className="mt-6">
            <Link to="/forgot-password">
              <Button fullWidth>Request new reset link</Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  const onSubmit = async (data: PasswordResetFormValues) => {
    try {
      setIsLoading(true)
      // Here you would implement your password reset logic
      console.log("Password reset data:", { ...data, token })

      await resetPassword({ token, password: data.password, email })

      // Show success message
      setResetSuccess(true)
    } catch (error) {
      console.error("Password reset failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (resetSuccess) {
    return (
      <AuthLayout
        showSocialLogin={false}
        title="Password reset successful"
        description="Your password has been reset successfully"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            You can now sign in with your new password.
          </p>
          <div className="mt-6">
            <Link to="/login">
              <Button fullWidth>Sign in</Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      showSocialLogin={false}
      title="Set new password"
      description="Enter a new password for your account"
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="New password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          error={errors.password?.message}
        />

        <FormInput
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        <Button type="submit" fullWidth isLoading={isLoading}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  )
}

export default ResetPasswordPage
