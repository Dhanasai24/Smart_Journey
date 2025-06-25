"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../Context/AuthContext"
import { ROUTES } from "../Utils/Constants"

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to={ROUTES.LOGIN} replace />
}

export default ProtectedRoute
