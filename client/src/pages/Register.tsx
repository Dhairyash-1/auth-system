import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, Navigate, useNavigate } from "react-router"
import type { RegisterFormValues } from "../utils/validationSchemas"
import { registerSchemaWithConfirmation } from "../utils/validationSchemas"
import AuthLayout from "../components/AuthLayout"
import FormInput from "../components/FormInput"
import Button from "../components/Button"
import { registerUser } from "../api/auth"
import { toast } from "react-toastify"
import { useAuth } from "../context/useAuth"

const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchemaWithConfirmation),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true)
      // Here you would implement your registration logic
      console.log("Registration data:", data)

      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      })
      toast.success("Registration successful! Please log in to continue.")
      // Redirect to dashboard or login page after successful registration
      navigate("/login")
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        "Something went wrong. Please try again"
      toast.error(msg, { autoClose: 3000 })
      console.error("Registration failed:", error)
    } finally {
      setIsLoading(false)
    }
  }
  if (!loading && isAuthenticated) return <Navigate to={"/"} />

  return (
    <AuthLayout
      title="Create your account"
      description="Join thousands of users today"
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            label="First name"
            autoComplete="given-name"
            {...register("firstName")}
            error={errors.firstName?.message}
          />

          <FormInput
            label="Last name"
            autoComplete="family-name"
            {...register("lastName")}
            error={errors.lastName?.message}
          />
        </div>

        <FormInput
          label="Email address"
          type="email"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
        />

        <FormInput
          label="Password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          error={errors.password?.message}
        />

        <FormInput
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register("acceptTerms")}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="font-medium text-gray-700">
              I accept the{" "}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Terms and Conditions
              </a>
            </label>
            {errors.acceptTerms && (
              <p className="mt-1 text-sm text-red-600">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          Create account
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
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

export default RegisterPage
