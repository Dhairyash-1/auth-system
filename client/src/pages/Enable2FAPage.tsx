import React, { useState } from "react"
import AuthLayout from "../components/AuthLayout"
import { QRCode } from "react-qrcode-logo"
import { Link, useLocation } from "react-router"
import Button from "../components/Button"
import FormInput from "../components/FormInput"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { tokenSchema, type TokenFormValue } from "../utils/validationSchemas"
import { verify2FA } from "../api/auth"

const Enable2FAPage = () => {
  const { state } = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [TwoFASuccess, setTwoFASuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<TokenFormValue>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      token: "",
    },
  })

  const onSubmit = async (data: TokenFormValue) => {
    try {
      setIsLoading(true)
      console.log("submit", data)
      await verify2FA({ token: data.token, secret: state.base32Secret })
      // Show success message
      setTwoFASuccess(true)
    } catch (error) {
      console.error("2FA enable failed", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (TwoFASuccess) {
    return (
      <AuthLayout
        showSocialLogin={false}
        title="2FA Enabled Successfully"
        // description="Your password has been reset successfully"
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
            You can now go to dashboard
          </p>
          <div className="mt-6">
            <Link to="/">
              <Button fullWidth>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }
  console.log("QR code value:", state)

  return (
    <AuthLayout
      showSocialLogin={false}
      title="Enable Two-Factor Authentication"
      description="Enhance your account security"
    >
      <div className="flex flex-col items-center space-y-6">
        <div className="p-4 bg-white border rounded-lg">
          <img src={state.otpauthUrl} width={200} />
        </div>

        <div className="text-center w-full">
          <p className="text-sm text-gray-600 mb-2">
            Scan the QR code with your authenticator app
          </p>
          <p className="text-sm text-gray-600">
            Or enter this secret manually:
            <br />
            <span className="font-mono  bg-gray-100 px-2 py-1 rounded text-sm select-all break-all">
              {state.base32Secret}
            </span>
          </p>
        </div>
        <div className="w-full pt-4 border-t border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              label="Verification Code"
              type="text"
              placeholder="Enter 6-digit code"
              autoComplete="one-time-code"
              maxLength={6}
              {...register("token")}
              error={errors.token?.message}
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                onClick={() => window.history.back()}
              >
                Cancel
              </button>
              <Button type="submit" isLoading={isLoading}>
                Verify & Enable 2FA
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}

export default Enable2FAPage
