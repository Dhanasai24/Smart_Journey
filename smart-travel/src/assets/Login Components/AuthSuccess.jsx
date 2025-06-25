"use client"

import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../Context/AuthContext"
import { ROUTES } from "../Utils/Constants"

const AuthSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuthData } = useAuth()

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        const token = searchParams.get("token")
        const error = searchParams.get("error")

        if (error) {
          console.error("Authentication error:", error)
          navigate(ROUTES.LOGIN + "?error=" + error)
          return
        }

        if (token) {
          // Store the token
          localStorage.setItem("token", token)
          setAuthData(token)

          // Small delay to ensure state updates, then redirect to landing page
          setTimeout(() => {
            navigate("/", { replace: true })
          }, 100)
        } else {
          console.error("No token received")
          navigate(ROUTES.LOGIN + "?error=no_token")
        }
      } catch (error) {
        console.error("Auth success error:", error)
        navigate(ROUTES.LOGIN + "?error=auth_failed")
      }
    }

    handleAuthSuccess()
  }, [searchParams, navigate, setAuthData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Smart Journey!</h2>
        <p className="text-gray-600">Taking you to the main page...</p>
      </div>
    </div>
  )
}

export default AuthSuccess
