import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router"
import type { RequestPasswordResetFormValues } from "../utils/validationSchemas"
import { requestPasswordResetSchema } from "../utils/validationSchemas"
import AuthLayout from "../components/AuthLayout"
import FormInput from "../components/FormInput"
import Button from "../components/Button"

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetFormValues>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: RequestPasswordResetFormValues) => {
    try {
      setIsLoading(true)
      // Here you would implement your password reset request logic
      console.log("Password reset request for:", data.email)

      // Simulate API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      setIsEmailSent(true)
    } catch (error) {
      console.error("Password reset request failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <AuthLayout
        showSocialLogin={false}
        title="Check your email"
        description="We've sent a password reset link to your email address"
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
            If an account exists with the email you entered, we've sent a link
            to reset your password. Please check your email inbox and spam
            folder.
          </p>
          <p className="text-sm text-gray-600">
            Didn't receive the email?{" "}
            <button
              type="button"
              onClick={() => setIsEmailSent(false)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Try again
            </button>
          </p>
          <div className="mt-6">
            <Link to="/login">
              <Button variant="secondary" fullWidth>
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      showSocialLogin={false}
      title="Reset your password"
      description="Enter your email address and we'll send you a link to reset your password"
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Email address"
          type="email"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
        />

        <Button type="submit" fullWidth isLoading={isLoading}>
          Send reset link
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
