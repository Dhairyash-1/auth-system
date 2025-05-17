import { zodResolver } from "@hookform/resolvers/zod"
import AuthLayout from "../components/AuthLayout"
import FormInput from "../components/FormInput"
import { useForm } from "react-hook-form"
import {
  passwordChangeSchema,
  type PasswordChangeFormValues,
} from "../utils/validationSchemas"
import Button from "../components/Button"
import { useState } from "react"
import { changePassword } from "../api/auth"
import { toast } from "react-toastify"
import { Link, useNavigate } from "react-router"
import { useAuth } from "../context/useAuth"

const ChangePassword = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  })

  const onSubmit = async (data: PasswordChangeFormValues) => {
    try {
      setIsLoading(true)
      // Here you would implement your password reset logic
      await changePassword({
        password: data.currentPassword,
        newPassword: data.newPassword,
      })

      setChangePasswordSuccess(true)

      console.log("Password change data:", data)
    } catch (error: any) {
      const msg =
        error.response.data.message ||
        "something went wrong while password change"
      toast.error(msg)
      console.error("Password change failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (changePasswordSuccess) {
    return (
      <AuthLayout
        showSocialLogin={false}
        title="Password Change Successful"
        description="Your password has been changed successfully"
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
            <Button
              onClick={() => {
                logout()
                navigate("/login")
              }}
              fullWidth
            >
              Sign in
            </Button>
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
          label="Current password"
          type="password"
          autoComplete="current-password"
          {...register("currentPassword")}
          error={errors.currentPassword?.message}
        />
        <FormInput
          label="New password"
          type="password"
          autoComplete="new-password"
          {...register("newPassword")}
          error={errors.newPassword?.message}
        />

        <FormInput
          label="Confirm new password"
          type="password"
          autoComplete="confirm-new-password"
          {...register("confirmNewPassword")}
          error={errors.confirmNewPassword?.message}
        />

        <Button type="submit" fullWidth isLoading={isLoading}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  )
}

export default ChangePassword
