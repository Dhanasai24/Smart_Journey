"use client"

import { Routes, Route } from "react-router-dom"
import { useAuth } from "./assets/Context/AuthContext"
import { useSocket } from "./Hooks/UseSocket" // INTEGRATED - useSocket hook
import AgoraChatPage from "./AgoraChatComponents/AgoraChatPage"

// Import components
import Navbar from "./StartComponents/Navbar" // ADDED: Import Navbar
import LandingPage from "./StartComponents/LandingPage"
import Login from "./assets/Login Components/Login"
import Register from "./assets/Login Components/Register"
import Dashboard from "./assets/Login Components/Dashboard"
import AuthSuccess from "./assets/Login Components/AuthSuccess"
import ProtectedRoute from "./assets/Login Components/ProtectedRoute"
import MyTrips from "./StartComponents/MyTrips"
import SocialTravel from "./StartComponents/SocialTravel"
import PublicTrips from "./StartComponents/PublicTrips" // NEW - INTEGRATED
import TripDetails from "./StartComponents/TripDetails" // ADDED: Import TripDetails
import ReviewsPage from "./StartComponents/ReviewsPage" // NEW: Import ReviewsPage
import App from "./App"

const AppRoutes = () => {
  const { user, loading } = useAuth()
  const { socket, isConnected } = useSocket() // INTEGRATED - Initialize socket connection

  // Enhanced logging for debugging
  console.log("🔌 Socket connected:", isConnected)
  console.log("👤 User authenticated:", user ? `${user.name} (${user.email})` : "No user")
  console.log("⏳ Auth loading:", loading)

  // Show loading spinner while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ADDED: Navbar component that shows on all pages */}
      <Navbar />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route path="/reviews" element={<ReviewsPage />} /> {/* NEW: Public reviews page */}
        {/* Features that can be VIEWED by everyone */}
        <Route path="/trip-planner" element={<App />} />
        <Route path="/public-trips" element={<PublicTrips />} />
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-trips"
          element={
            <ProtectedRoute>
              <MyTrips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/social-travel"
          element={
            <ProtectedRoute>
              <SocialTravel />
            </ProtectedRoute>
          }
        />
        {/* ADDED: Trip Details Route */}
        <Route
          path="/trip-details/:id"
          element={
            <ProtectedRoute>
              <TripDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agora-chat/:userId"
          element={
            <ProtectedRoute>
              <AgoraChatPage />
            </ProtectedRoute>
          }
        />
        {/* Fallback route */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </>
  )
}

export default AppRoutes
