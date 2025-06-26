"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { API_BASE_URL } from "../Utils/Constants"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem("token"))

  useEffect(() => {
    // ✅ ENHANCED: Check for stored user data first
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.warn("Could not parse stored user data:", error)
        localStorage.removeItem("user")
      }
    }

    if (token) {
      fetchUserProfile()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        // ✅ ENHANCED: Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(data.user))
        console.log("User profile loaded:", data.user)
      } else {
        console.log("Failed to fetch profile, clearing auth data")
        localStorage.removeItem("token")
        localStorage.removeItem("user") // ✅ Clear user data too
        setToken(null)
        setUser(null)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("user") // ✅ Clear user data too
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user)) // ✅ Store user data
        setToken(data.token)
        setUser(data.user)
        console.log("Login successful:", data.user)
        return data
      } else {
        throw new Error(data.message || "Login failed")
      }
    } catch (error) {
      throw error
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user)) // ✅ Store user data
        setToken(data.token)
        setUser(data.user)
        console.log("Registration successful:", data.user)
        return data
      } else {
        throw new Error(data.message || "Registration failed")
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user") // ✅ Clear user data too
      setToken(null)
      setUser(null)
      console.log("User logged out")
    }
  }

  const setAuthData = (newToken) => {
    console.log("Setting new auth token:", newToken ? "Token received" : "No token")
    setToken(newToken)
    if (newToken) {
      localStorage.setItem("token", newToken)
    }
  }

  // ✅ ENHANCED: Add setUser method for external use
  const updateUser = (userData) => {
    setUser(userData)
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData))
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    setAuthData,
    setUser: updateUser, // ✅ Expose setUser method
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
