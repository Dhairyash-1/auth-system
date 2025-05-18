import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, Navigate, useLocation, useNavigate } from "react-router"
import AuthLayout from "../components/AuthLayout"
import FormInput from "../components/FormInput"
import Button from "../components/Button"
import { verify2FADuringLogin } from "../api/auth"
import { useAuth } from "../context/useAuth"

const twoFactorSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
})

type TwoFactorFormValues = z.infer<typeof twoFactorSchema>

const TwoFAVerificationPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { state } = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: "",
    },
  })

  const onSubmit = async (data: TwoFactorFormValues) => {
    setIsLoading(true)
    try {
      const res = await verify2FADuringLogin({
        token: data.code,
        tempToken: state.tempToken,
        rememberMe: state.rememberMe,
      })
      console.log(res)
      if (res.statusCode === 401) {
        setError("code", {
          type: "manual",
          message: "Please enter correct 2FA code.",
        })
        return
      }
      login(res.data)
      navigate("/")
    } catch (err: any) {
      setError("code", {
        type: "manual",
        message:
          err.response.data.message ||
          "An error occurred during verification. Please try again.",
      })
      console.error("2FA verification error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!state?.tempToken || !state?.rememberMe) {
    return <Navigate to={"/login"} />
  }

  return (
    <AuthLayout
      showSocialLogin={false}
      title="Two-Factor Authentication"
      description="Enter the verification code from your authenticator app"
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Verification Code"
          type="text"
          placeholder="Enter 6-digit code"
          autoComplete="one-time-code"
          maxLength={6}
          {...register("code")}
          error={errors.code?.message}
        />

        <Button type="submit" fullWidth isLoading={isLoading}>
          Verify and Sign In
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-center">
        <Link to={"/login"}>
          <Button type="button">Back to login</Button>
        </Link>
      </div>
    </AuthLayout>
  )
}

export default TwoFAVerificationPage
