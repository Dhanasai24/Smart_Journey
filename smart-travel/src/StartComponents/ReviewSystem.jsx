"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Camera,
  X,
  Send,
  ThumbsUp,
  Clock,
  Award,
  Lightbulb,
  Upload,
} from "lucide-react"
import { useAuth } from "../assets/Context/AuthContext"
import { API_BASE_URL } from "../assets/Utils/Constants"
import axios from "axios"

const ReviewSystem = ({ tripData, onClose, onReviewSubmitted }) => {
  const { user, token } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Review form data
  const [reviewData, setReviewData] = useState({
    destination: tripData?.destination || "",
    rating: 0,
    title: "",
    review_text: "",
    travel_date: tripData?.travelDates?.startDate || "",
    trip_duration: tripData?.days || 0,
    budget_spent: tripData?.budget || 0,
    travel_style: tripData?.groupType || "solo",
    highlights: [],
    tips: "",
    would_recommend: true,
    is_public: true,
    images: [],
  })

  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedImages, setSelectedImages] = useState([])
  const [newHighlight, setNewHighlight] = useState("")

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  const showToast = useCallback((message, type = "info") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
          ? "bg-red-500 text-white"
          : "bg-blue-500 text-white"
    }`
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = "0"
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 300)
    }, 4000)
  }, [])

  const handleStarClick = (rating) => {
    setReviewData((prev) => ({ ...prev, rating }))
  }

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length + selectedImages.length > 5) {
      showToast("Maximum 5 images allowed", "error")
      return
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size should be less than 5MB", "error")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            file,
            preview: e.target.result,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (imageId) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const addHighlight = () => {
    if (newHighlight.trim() && reviewData.highlights.length < 5) {
      setReviewData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, newHighlight.trim()],
      }))
      setNewHighlight("")
    }
  }

  const removeHighlight = (index) => {
    setReviewData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    if (!reviewData.rating || !reviewData.title.trim() || !reviewData.review_text.trim()) {
      showToast("Please fill in all required fields", "error")
      return
    }

    if (!token) {
      showToast("Please log in to submit a review", "error")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("🚀 Starting review submission...")
      console.log("📦 Review data:", reviewData)
      console.log("🔐 Token present:", !!token)
      console.log("👤 User:", user)

      // Convert images to base64 for submission
      const imagePromises = selectedImages.map((img) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(img.file)
        })
      })

      const imageUrls = await Promise.all(imagePromises)
      console.log("📸 Processed images:", imageUrls.length)

      const submitData = {
        ...reviewData,
        trip_id: tripData?.id || null,
        images: imageUrls,
      }

      console.log("📤 Submitting data:", {
        ...submitData,
        images: `${submitData.images.length} images`,
        review_text: submitData.review_text.substring(0, 50) + "...",
      })

      const response = await api.post("/reviews", submitData)
      console.log("✅ Review submission response:", response.data)

      if (response.data.success) {
        showToast("Review submitted successfully! 🎉", "success")
        onReviewSubmitted?.(response.data.review)
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        throw new Error(response.data.message || "Failed to submit review")
      }
    } catch (error) {
      console.error("❌ Error submitting review:", error)
      console.error("❌ Error response:", error.response?.data)
      console.error("❌ Error status:", error.response?.status)

      let errorMessage = "Failed to submit review. Please try again."

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.status === 401) {
        errorMessage = "Please log in to submit a review"
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please check if the database is properly set up."
      }

      showToast(errorMessage, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const travelStyleOptions = [
    { id: "solo", label: "Solo Travel", icon: "🧳" },
    { id: "couple", label: "Couple", icon: "💕" },
    { id: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
    { id: "friends", label: "Friends", icon: "👥" },
    { id: "group", label: "Group", icon: "🎉" },
    { id: "business", label: "Business", icon: "💼" },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Share Your Experience</h2>
                <p className="text-purple-100">Help other travelers with your insights</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Step 1: Basic Information */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Rate Your Experience</h3>
                  <p className="text-gray-600 dark:text-gray-300">Start by rating your overall experience</p>
                </div>

                {/* Destination */}
                <div className="space-y-3">
                  <label className="block text-lg font-semibold text-gray-800 dark:text-white flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <span>Destination</span>
                  </label>
                  <input
                    type="text"
                    value={reviewData.destination}
                    onChange={(e) => setReviewData((prev) => ({ ...prev, destination: e.target.value }))}
                    className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                    placeholder="Where did you travel?"
                  />
                </div>

                {/* Star Rating */}
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-800 dark:text-white">Overall Rating *</label>
                  <div className="flex items-center justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="transition-all duration-200 transform hover:scale-110"
                      >
                        <Star
                          className={`w-12 h-12 ${
                            star <= (hoveredStar || reviewData.rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-gray-600 dark:text-gray-300">
                    {reviewData.rating === 0 && "Click to rate"}
                    {reviewData.rating === 1 && "Poor"}
                    {reviewData.rating === 2 && "Fair"}
                    {reviewData.rating === 3 && "Good"}
                    {reviewData.rating === 4 && "Very Good"}
                    {reviewData.rating === 5 && "Excellent"}
                  </p>
                </div>

                {/* Travel Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-lg font-semibold text-gray-800 dark:text-white flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span>Travel Date</span>
                    </label>
                    <input
                      type="date"
                      value={reviewData.travel_date}
                      onChange={(e) => setReviewData((prev) => ({ ...prev, travel_date: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-lg font-semibold text-gray-800 dark:text-white flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span>Trip Duration (days)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={reviewData.trip_duration}
                      onChange={(e) =>
                        setReviewData((prev) => ({ ...prev, trip_duration: Number.parseInt(e.target.value) || 0 }))
                      }
                      className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                      placeholder="Number of days"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!reviewData.rating || !reviewData.destination.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                  >
                    Next Step →
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Step 2: Detailed Review */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Tell Your Story</h3>
                  <p className="text-gray-600 dark:text-gray-300">Share the details of your amazing journey</p>
                </div>

                {/* Review Title */}
                <div className="space-y-3">
                  <label className="block text-lg font-semibold text-gray-800 dark:text-white">Review Title *</label>
                  <input
                    type="text"
                    value={reviewData.title}
                    onChange={(e) => setReviewData((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                    placeholder="Give your review a catchy title..."
                    maxLength={200}
                  />
                  <p className="text-sm text-gray-500">{reviewData.title.length}/200 characters</p>
                </div>

                {/* Review Text */}
                <div className="space-y-3">
                  <label className="block text-lg font-semibold text-gray-800 dark:text-white">Your Experience *</label>
                  <textarea
                    value={reviewData.review_text}
                    onChange={(e) => setReviewData((prev) => ({ ...prev, review_text: e.target.value }))}
                    className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all bg-white dark:bg-slate-800 text-gray-800 dark:text-white min-h-[120px]"
                    placeholder="Share your experience, what you loved, what could be better..."
                    rows={6}
                    maxLength={5000}
                  />
                  <p className="text-sm text-gray-500">{reviewData.review_text.length}/5000 characters</p>
                </div>

                {/* Travel Style and Budget */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-lg font-semibold text-gray-800 dark:text-white flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span>Travel Style</span>
                    </label>
                    <select
                      value={reviewData.travel_style}
                      onChange={(e) => setReviewData((prev) => ({ ...prev, travel_style: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                    >
                      {travelStyleOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-lg font-semibold text-gray-800 dark:text-white flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span>Budget Spent (₹)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={reviewData.budget_spent}
                      onChange={(e) =>
                        setReviewData((prev) => ({ ...prev, budget_spent: Number.parseInt(e.target.value) || 0 }))
                      }
                      className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                      placeholder="Total amount spent"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-3 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!reviewData.title.trim() || !reviewData.review_text.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                  >
                    Next Step →
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Step 3: Additional Details */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Add the Finishing Touches</h3>
                  <p className="text-gray-600 dark:text-gray-300">Photos, highlights, and tips for fellow travelers</p>
                </div>

                {/* Photo Upload */}
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-800 dark:text-white flex items-center space-x-2">
                    <Camera className="w-5 h-5 text-purple-600" />
                    <span>Photos (Optional)</span>
                  </label>

                  <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:border-purple-500 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-300 mb-2">Click to upload photos</p>
                      <p className="text-sm text-gray-500">Maximum 5 images, 5MB each</p>
                    </label>
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.preview || "/placeholder.svg"}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-xl"
                          />
                          <button
                            onClick={() => removeImage(image.id)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Highlights */}
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-800 dark:text-white flex items-center space-x-2">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <span>Trip Highlights</span>
                  </label>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addHighlight()}
                      className="flex-1 p-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-all bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                      placeholder="Add a highlight..."
                      maxLength={50}
                    />
                    <button
                      onClick={addHighlight}
                      disabled={!newHighlight.trim() || reviewData.highlights.length >= 5}
                      className="px-4 py-3 bg-yellow-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {reviewData.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {reviewData.highlights.map((highlight, index) => (
                        <span
                          key={index}
                          className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2"
                        >
                          <span>{highlight}</span>
                          <button
                            onClick={() => removeHighlight(index)}
                            className="text-yellow-600 hover:text-yellow-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tips */}
                <div className="space-y-3">
                  <label className="block text-lg font-semibold text-gray-800 dark:text-white flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    <span>Tips for Fellow Travelers</span>
                  </label>
                  <textarea
                    value={reviewData.tips}
                    onChange={(e) => setReviewData((prev) => ({ ...prev, tips: e.target.value }))}
                    className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                    placeholder="Share any tips, recommendations, or advice..."
                    rows={4}
                  />
                </div>

                {/* Recommendation */}
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-800 dark:text-white">
                    Would you recommend this destination?
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setReviewData((prev) => ({ ...prev, would_recommend: true }))}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
                        reviewData.would_recommend
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white"
                      }`}
                    >
                      <ThumbsUp className="w-5 h-5" />
                      <span>Yes, I recommend it!</span>
                    </button>
                    <button
                      onClick={() => setReviewData((prev) => ({ ...prev, would_recommend: false }))}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
                        !reviewData.would_recommend
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white"
                      }`}
                    >
                      <X className="w-5 h-5" />
                      <span>Not really</span>
                    </button>
                  </div>
                </div>

                {/* Privacy */}
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={reviewData.is_public}
                      onChange={(e) => setReviewData((prev) => ({ ...prev, is_public: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-800 dark:text-white font-medium">
                      Make this review public (others can see it)
                    </span>
                  </label>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-3 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full transition-all ${
                  step <= currentStep ? "bg-purple-600" : "bg-gray-300 dark:bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ReviewSystem
