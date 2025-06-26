"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../Context/AuthContext"
import { ROUTES, API_BASE_URL } from "../Utils/Constants"

const AuthSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuthData } = useAuth()

  const [status, setStatus] = useState("processing") // processing, success, error, timeout
  const [errorMessage, setErrorMessage] = useState("")
  const [progress, setProgress] = useState("Authenticating...")

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        const token = searchParams.get("token")
        const error = searchParams.get("error")

        // Handle URL errors first
        if (error) {
          console.error("Authentication error from URL:", error)
          setStatus("error")
          setErrorMessage(getErrorMessage(error))
          return
        }

        if (!token) {
          console.error("No token received")
          setStatus("error")
          setErrorMessage("No authentication token received. Please try signing in again.")
          return
        }

        // Set up timeout for the entire process
        const timeoutId = setTimeout(() => {
          setStatus("timeout")
          setErrorMessage("Authentication is taking longer than expected. This might be due to server startup time.")
        }, 15000) // 15 seconds timeout

        try {
          // Step 1: Store token
          setProgress("Storing authentication data...")
          localStorage.setItem("token", token)
          setAuthData(token)

          // Step 2: Verify token with backend
          setProgress("Verifying with server...")
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            // Add timeout to the fetch request
            signal: AbortSignal.timeout(10000), // 10 seconds
          })

          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          console.log("✅ Authentication successful:", data.user)

          // Clear timeout since we succeeded
          clearTimeout(timeoutId)

          setStatus("success")
          setProgress("Success! Redirecting...")

          // Redirect after a short delay
          setTimeout(() => {
            navigate("/", { replace: true })
          }, 1000)
        } catch (fetchError) {
          clearTimeout(timeoutId)
          console.error("❌ Token verification failed:", fetchError)

          if (fetchError.name === "TimeoutError") {
            setStatus("timeout")
            setErrorMessage("Server is taking too long to respond. Please try again.")
          } else {
            setStatus("error")
            setErrorMessage(`Authentication verification failed: ${fetchError.message}`)
          }
        }
      } catch (error) {
        console.error("❌ Auth success error:", error)
        setStatus("error")
        setErrorMessage(`Authentication failed: ${error.message}`)
      }
    }

    handleAuthSuccess()
  }, [searchParams, navigate, setAuthData])

  const getErrorMessage = (error) => {
    switch (error) {
      case "auth_failed":
        return "Google authentication failed. Please try again."
      case "no_token":
        return "Authentication was incomplete. Please try signing in again."
      case "server_error":
        return "Server error during authentication. Please try again."
      default:
        return `Authentication error: ${error}`
    }
  }

  const handleRetry = () => {
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const handleGoHome = () => {
    navigate("/", { replace: true })
  }

  // Success state
  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Smart Journey!</h2>
          <p className="text-gray-600">{progress}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleGoHome}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Timeout state
  if (status === "timeout") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Taking Longer Than Expected</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <p className="text-sm text-gray-500 mb-6">
            This usually happens when the server is starting up. Render.com services can take 30-60 seconds to wake up
            from sleep.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={handleRetry}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Try Signing In Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state (default)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Smart Journey!</h2>
        <p className="text-gray-600 mb-4">{progress}</p>
        <div className="text-sm text-gray-500">
          <p>If this takes more than 30 seconds, the server might be starting up.</p>
          <p className="mt-1">Render.com services can take time to wake up from sleep.</p>
        </div>
      </div>
    </div>
  )
}

export default AuthSuccess
