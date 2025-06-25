"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Calendar, Plane, CheckCircle, Save } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "./assets/Context/AuthContext"
import { API_BASE_URL } from "./assets/Utils/Constants"

import TripDetailsForm from "./assets/components/trip-details-form"
import TransportSelection from "./assets/components/transport-selection"
import TripPlanGeneration from "./assets/components/trip-plan-generator"
import FinalItinerary from "./assets/components/final-result"

const steps = [
  { id: 1, title: "Trip Details", icon: MapPin, description: "Tell us about your dream destination" },
  { id: 2, title: "Transport", icon: Plane, description: "Choose your preferred travel method" },
  { id: 3, title: "AI Planning", icon: Calendar, description: "Let AI create your perfect itinerary" },
  { id: 4, title: "Final Plan", icon: CheckCircle, description: "Your complete travel guide" },
]

export default function App() {
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [tripData, setTripData] = useState({
    destination: "",
    startLocation: "",
    days: 0,
    budget: 0,
    foodPreferences: [],
    interests: [],
    travelDates: {
      startDate: "",
      endDate: "",
    },
    selectedTransport: null,
  })

  const { token, user } = useAuth()
  const navigate = useNavigate()

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const updateTripData = (data) => {
    setTripData((prev) => ({ ...prev, ...data }))
  }

  // ✅ FIXED: Ensure proper JSON formatting before sending to API
  const formatDataForAPI = (data) => {
    console.log("🔧 Formatting data for API:", data)

    // Ensure arrays are proper JSON arrays, not PostgreSQL arrays
    const formatArray = (arr) => {
      if (!arr || !Array.isArray(arr)) {
        return []
      }
      // Ensure all items are strings and remove any empty values
      return arr.filter((item) => item && item.trim()).map((item) => String(item).trim())
    }

    const formattedData = {
      title: `${data.destination} Adventure`,
      destination: data.destination || "",
      start_location: data.startLocation || "",
      days: Number.parseInt(data.days) || 0,
      budget: Number.parseInt(data.budget) || 0,
      travelers: Number.parseInt(data.travelers) || 1,
      start_date: data.travelDates?.startDate || null,
      end_date: data.travelDates?.endDate || null,

      // ✅ CRITICAL FIX: Ensure proper JSON array format
      food_preferences: formatArray(data.foodPreferences),
      interests: formatArray(data.interests),

      special_interest: data.specialInterest || null,

      // ✅ Ensure objects are properly formatted
      trip_plan: data.tripPlan || null,
      transport_plan: data.selectedTransport || null,
      weather_data: data.weatherData || null,
    }

    console.log("✅ Formatted data for API:")
    console.log("- food_preferences:", typeof formattedData.food_preferences, formattedData.food_preferences)
    console.log("- interests:", typeof formattedData.interests, formattedData.interests)
    console.log("- trip_plan:", typeof formattedData.trip_plan, formattedData.trip_plan ? "Present" : "Missing")

    return formattedData
  }

  const saveTrip = async (e) => {
    // Prevent default form submission if this is triggered by a form
    if (e && e.preventDefault) {
      e.preventDefault()
    }

    // Check authentication first
    if (!token) {
      setError("Please log in to save your trip")
      alert("Please log in to save your trip")
      navigate("/login")
      return
    }

    if (!tripData.tripPlan) {
      setError("Please complete the trip planning first!")
      alert("Please complete the trip planning first!")
      return
    }

    setSaving(true)
    setError("")

    try {
      console.log("💾 Attempting to save trip...")
      console.log("🔐 Token present:", !!token)
      console.log("👤 User:", user)
      console.log("📍 API URL:", `${API_BASE_URL}/trips`)

      // ✅ CRITICAL FIX: Format data properly before sending
      const formattedTripData = formatDataForAPI(tripData)

      console.log("📦 Final data being sent to API:")
      console.log(JSON.stringify(formattedTripData, null, 2))

      const response = await fetch(`${API_BASE_URL}/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedTripData),
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response ok:", response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Trip saved successfully:", result)
        alert("Trip saved successfully!")
        navigate("/my-trips")
      } else {
        const errorData = await response.json()
        console.error("❌ Save error response:", errorData)
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("❌ Error saving trip:", error)
      const errorMessage = error.message || "Unknown error occurred"
      setError(`Failed to save trip: ${errorMessage}`)
      alert(`Failed to save trip: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Progress Steps */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <div className="flex items-center justify-center mb-10">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        currentStep >= step.id
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <step.icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${currentStep >= step.id ? "text-gray-800" : "text-gray-400"}`}
                    >
                      {step.title}
                    </span>
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-1 ${
                        currentStep > index + 1 ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <TripDetailsForm tripData={tripData} updateTripData={updateTripData} onNext={nextStep} />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <TransportSelection
                tripData={tripData}
                updateTripData={updateTripData}
                onNext={nextStep}
                onPrev={prevStep}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <TripPlanGeneration
                tripData={tripData}
                updateTripData={updateTripData}
                onNext={nextStep}
                onPrev={prevStep}
              />
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={saveTrip}>
                <div className="flex justify-end mb-6">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? "Saving..." : "Save Trip"}</span>
                  </motion.button>
                </div>
                <FinalItinerary tripData={tripData} onPrev={prevStep} />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
