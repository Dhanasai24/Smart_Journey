"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  MapPin,
  Utensils,
  Heart,
  Calendar,
  DollarSign,
  Users,
  Plane,
  Star,
  Sparkles,
  Globe,
  Camera,
  Mountain,
  Waves,
  Lightbulb,
} from "lucide-react"

const foodOptions = [
  "Vegetarian",
  "Non-Vegetarian",
  "Vegan",
  "Street Food",
  "Fine Dining",
  "Local Cuisine",
  "Continental",
  "Asian",
  "Italian",
  "Mexican",
]

const interestOptions = [
  "Historical Sites",
  "Museums",
  "Adventure Sports",
  "Nature & Wildlife",
  "Beaches",
  "Mountains",
  "Shopping",
  "Nightlife",
  "Photography",
  "Cultural Events",
  "Religious Places",
  "Architecture",
  "Waterfalls",
]

const travelGroupTypes = [
  { id: "solo", label: "Solo Travel", icon: "🧳", description: "Just me, myself & I" },
  { id: "couple", label: "Couple", icon: "💕", description: "Romantic getaway" },
  { id: "family", label: "Family", icon: "👨‍👩‍👧‍👦", description: "Family vacation" },
  { id: "friends", label: "Friends", icon: "👥", description: "Friends trip" },
  { id: "group", label: "Group", icon: "🎉", description: "Large group travel" },
  { id: "business", label: "Business", icon: "💼", description: "Work travel" },
]

export default function TripDetailsForm({ tripData, updateTripData, onNext }) {
  const [selectedGroupType, setSelectedGroupType] = useState(tripData.groupType || "")

  const handleFoodPreferenceToggle = (food) => {
    const updated = tripData.foodPreferences?.includes(food)
      ? tripData.foodPreferences.filter((f) => f !== food)
      : [...(tripData.foodPreferences || []), food]
    updateTripData({ foodPreferences: updated })
  }

  const handleInterestToggle = (interest) => {
    const updated = tripData.interests?.includes(interest)
      ? tripData.interests.filter((i) => i !== interest)
      : [...(tripData.interests || []), interest]
    updateTripData({ interests: updated })
  }

  const handleGroupTypeSelect = (groupType) => {
    if (selectedGroupType === groupType.id) {
      // If clicking the same option, deselect it
      setSelectedGroupType("")
      updateTripData({
        groupType: "",
        groupLabel: "",
      })
    } else {
      // If clicking a different option, select it
      setSelectedGroupType(groupType.id)
      updateTripData({
        groupType: groupType.id,
        groupLabel: groupType.label,
      })
    }
  }

  const isFormValid =
    tripData.destination && tripData.startLocation && tripData.days > 0 && tripData.budget > 0 && tripData.travelers > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            ✨ Plan Your Dream Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Tell us about your travel dreams and let our AI create the perfect personalized itinerary just for you
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>500+ Destinations</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>AI-Powered Planning</span>
            </div>
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Personalized Experience</span>
            </div>
          </div>
        </motion.div>

        {/* Main Form Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-8 space-y-8">
            {/* Trip Basics */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Trip Essentials</h2>
                    <p className="text-blue-100">Where dreams meet reality</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Destination & Start Location */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-lg font-semibold text-gray-800 flex items-center space-x-2">
                      <Plane className="w-5 h-5 text-purple-600" />
                      <span>Dream Destination</span>
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-gray-50/50"
                      placeholder="Where do you want to go?"
                      value={tripData.destination || ""}
                      onChange={(e) => updateTripData({ destination: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-lg font-semibold text-gray-800 flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span>Starting From</span>
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gray-50/50"
                      placeholder="Your departure city"
                      value={tripData.startLocation || ""}
                      onChange={(e) => updateTripData({ startLocation: e.target.value })}
                    />
                  </div>
                </div>

                {/* Days, Budget, Date */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="block text-lg font-semibold text-gray-800 flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span>Duration</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 bg-gray-50/50"
                      placeholder="Days"
                      value={tripData.days || ""}
                      onChange={(e) => updateTripData({ days: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-lg font-semibold text-gray-800 flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      <span>Budget (₹)</span>
                    </label>
                    <input
                      type="number"
                      min="1000"
                      className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-gray-50/50"
                      placeholder="Total budget"
                      value={tripData.budget || ""}
                      onChange={(e) => updateTripData({ budget: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-lg font-semibold text-gray-800 flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-pink-600" />
                      <span>Start Date</span>
                    </label>
                    <input
                      type="date"
                      className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300 bg-gray-50/50"
                      value={tripData.travelDates?.startDate || ""}
                      onChange={(e) =>
                        updateTripData({
                          travelDates: { ...tripData.travelDates, startDate: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Special Interest - NEW SECTION */}
                <div className="space-y-3">
                  <label className="block text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <span>Special Interest</span>
                  </label>
                  <div className="relative">
                    <textarea
                      className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all duration-300 bg-gray-50/50 min-h-[100px]"
                      placeholder="Tell us about any special interest or unique experience you're looking for..."
                      value={tripData.specialInterest || ""}
                      onChange={(e) => updateTripData({ specialInterest: e.target.value })}
                    />
                    <div className="absolute right-4 bottom-4 text-xs text-gray-400">
                      Share your unique passion or interest
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Food Preferences */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Culinary Preferences</h2>
                    <p className="text-orange-100">What flavors call to you?</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {foodOptions.map((food) => (
                    <motion.button
                      key={food}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleFoodPreferenceToggle(food)}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                        tripData.foodPreferences?.includes(food)
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-lg"
                          : "bg-white/50 text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      <div className="text-sm font-semibold">{food}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Interests */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Interests & Passions</h2>
                    <p className="text-green-100">What makes your heart race?</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {interestOptions.map((interest) => (
                    <motion.button
                      key={interest}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                        tripData.interests?.includes(interest)
                          ? "bg-gradient-to-r from-green-500 to-teal-500 text-white border-green-500 shadow-lg"
                          : "bg-white/50 text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50"
                      }`}
                    >
                      <div className="text-sm font-semibold">{interest}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Travelers */}
          <div className="lg:col-span-4 space-y-8">
            {/* Travel Group */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Travel Companions</h2>
                    <p className="text-purple-100">Who's joining the adventure?</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Group Type Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Travel Style</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {travelGroupTypes.map((groupType) => (
                      <motion.button
                        key={groupType.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleGroupTypeSelect(groupType)}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                          selectedGroupType === groupType.id
                            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-500 shadow-lg"
                            : "bg-white/50 text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{groupType.icon}</span>
                          <div>
                            <div className="font-semibold">{groupType.label}</div>
                            <div
                              className={`text-xs ${selectedGroupType === groupType.id ? "text-purple-100" : "text-gray-500"}`}
                            >
                              {groupType.description}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Number of Travelers */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Number of Travelers</h3>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-gray-50/50"
                      placeholder="How many people?"
                      value={tripData.travelers || ""}
                      onChange={(e) => updateTripData({ travelers: Number.parseInt(e.target.value) || 0 })}
                    />
                    <Users className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Trip Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-semibold text-purple-600">{tripData.days || 0} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Budget per person</span>
                      <span className="font-semibold text-green-600">
                        ₹
                        {tripData.budget && tripData.travelers
                          ? Math.round(tripData.budget / tripData.travelers).toLocaleString()
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total travelers</span>
                      <span className="font-semibold text-blue-600">{tripData.travelers || 0} people</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Special Interest Highlight Card - NEW SECTION */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-200 rounded-3xl shadow-2xl p-6 text-gray-800"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-white/30 rounded-2xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Special Interest</h3>
                  <p className="text-amber-700">What makes this trip unique for you?</p>
                </div>
              </div>
              <div className="bg-white/40 rounded-xl p-4 backdrop-blur-sm">
                <p className="italic text-gray-700">
                  {tripData.specialInterest || "Add your special interest to make this trip truly yours..."}
                </p>
              </div>
            </motion.div>

            {/* Inspiration Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-3xl shadow-2xl p-6 text-white"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">AI Magic Awaits</h3>
                  <p className="text-purple-100">Ready to create something amazing?</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Mountain className="w-4 h-4" />
                  <span>Discover hidden gems</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Waves className="w-4 h-4" />
                  <span>Perfect timing suggestions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span>Instagram-worthy spots</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center pt-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            disabled={!isFormValid}
            className={`px-12 py-6 text-xl font-bold rounded-2xl transition-all duration-300 shadow-2xl ${
              isFormValid
                ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:shadow-3xl transform hover:-translate-y-1"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center space-x-3">
              <span>🚀 Find Perfect Transport Options</span>
              <Plane className="w-6 h-6" />
            </div>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
