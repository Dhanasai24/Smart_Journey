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
          path="/trip-planner"
          element={
            <ProtectedRoute>
              <App />
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
        {/* NEW: Public Trips Route - INTEGRATED */}
        <Route
          path="/public-trips"
          element={
            <ProtectedRoute>
              <PublicTrips />
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
