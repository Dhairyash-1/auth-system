import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, Navigate, useLocation } from "react-router"
import type { LoginFormValues } from "../utils/validationSchemas"
import { loginSchema } from "../utils/validationSchemas"
import AuthLayout from "../components/AuthLayout"
import FormInput from "../components/FormInput"
import Button from "../components/Button"
import { toast } from "react-toastify"
import { loginUser } from "../api/auth"
import { useAuth } from "../context/useAuth"

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading, login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true)

      const res = await loginUser({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe || false,
      })
      console.log("res", res)
      if (res.data?.tempToken) {
        // first do 2fa
        navigate("/2fa-verify", {
          state: {
            tempToken: res.data?.tempToken,
            rememberMe: data.rememberMe || false,
          },
        })
      } else {
        login(res.data)
        toast.success("Login successful! Welcome back 😊")
        navigate("/")
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        "Something went wrong. Please try again"
      toast.error(msg, { autoClose: 3000 })
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const error = params.get("error")

    if (error) {
      toast.error(error)
    }
  }, [location])

  if (!loading && isAuthenticated) return <Navigate to={"/"} />

  return (
    <AuthLayout
      title="Sign in to your account"
      // description="Or start your 14-day free trial"
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Email address"
          type="email"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
        />

        <div>
          <FormInput
            label="Password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            error={errors.password?.message}
          />
          <div className="text-right mt-1">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            {...register("rememberMe")}
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-gray-900"
          >
            Remember me
          </label>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              New to our platform?
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Link to="/register">
            <Button type="button" variant="secondary" fullWidth>
              Create an account
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
