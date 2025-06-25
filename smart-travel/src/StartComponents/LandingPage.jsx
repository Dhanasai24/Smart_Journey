"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../assets/Context/AuthContext"
import {
  MapPin,
  Users,
  Star,
  ArrowRight,
  Globe,
  Shield,
  Zap,
  MessageSquare,
  Heart,
  Rocket,
  Brain,
  Navigation,
  Clock,
  CheckCircle,
  PlayCircle,
  Plane,
  Mail,
  Phone,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Award,
  TrendingUp,
  Target,
  Edit3,
  Sparkles,
} from "lucide-react"
import bgImage from "../assets/Images/Landbg.jpg"

const LandingPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalTrips: 1250,
    happyTravelers: 850,
    destinations: 120,
    avgRating: 4.8,
    totalReviews: 2340,
  })
  const [realReviews, setRealReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")

  // Predefined high-quality reviews as fallback
  const predefinedReviews = [
    {
      id: "pred_1",
      user_name: "Sarah Johnson",
      destination: "Bali, Indonesia",
      rating: 5,
      review_text:
        "Absolutely incredible experience! The AI-powered itinerary was spot-on and helped me discover hidden gems I never would have found. The sustainable travel options made me feel good about my environmental impact. Highly recommend!",
      created_at: "2024-01-15T10:30:00Z",
    },
    {
      id: "pred_2",
      user_name: "Michael Chen",
      destination: "Costa Rica",
      rating: 5,
      review_text:
        "Smart Travel revolutionized my vacation planning! The personalized recommendations were perfect for my adventure style, and connecting with fellow travelers made the experience even more memorable. The eco-friendly focus is exactly what modern travel needs.",
      created_at: "2024-01-10T14:20:00Z",
    },
    {
      id: "pred_3",
      user_name: "Emma Rodriguez",
      destination: "New Zealand",
      rating: 5,
      review_text:
        "From planning to execution, everything was flawless! The AI understood my preferences perfectly and created an itinerary that exceeded all expectations. The social features helped me meet amazing people. This platform is the future of travel!",
      created_at: "2024-01-05T09:15:00Z",
    },
  ]

  // Fetch real reviews from the API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/reviews/public")
        const data = await response.json()

        if (data.success && data.reviews.length > 0) {
          // Sort by rating and get top 3
          const sortedReviews = data.reviews.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3)
          setRealReviews(sortedReviews)
        } else {
          // Use predefined reviews as fallback
          setRealReviews(predefinedReviews)
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
        // Use predefined reviews as fallback
        setRealReviews(predefinedReviews)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  useEffect(() => {
    // Animate stats on load
    const timer = setTimeout(() => {
      setStats({
        totalTrips: 1250,
        happyTravelers: 850,
        destinations: 120,
        avgRating: 4.8,
        totalReviews: 2340,
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call - replace with actual endpoint
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSubmitMessage("Thank you! Your message has been sent successfully. We'll get back to you soon!")
      setContactForm({ name: "", email: "", message: "" })
    } catch (error) {
      setSubmitMessage("Sorry, there was an error sending your message. Please try again.")
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSubmitMessage(""), 5000)
    }
  }

  const handleWriteReview = () => {
    // Navigate to the trip details page where the review form is located
    if (user) {
      navigate("/my-trips", { state: { openReviewForm: true } })
    } else {
      navigate("/login", { state: { redirectTo: "/my-trips", openReviewForm: true } })
    }
  }

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Planning",
      description: "Advanced AI creates personalized itineraries tailored to your preferences and dreams",
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-500/10",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Destinations",
      description: "Explore 120+ destinations worldwide with local insights and expert recommendations",
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Social Travel",
      description: "Connect with fellow travelers and share amazing experiences together worldwide",
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Travel Reviews",
      description: "Read authentic reviews and share your own incredible travel experiences",
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Reliable",
      description: "Your data is protected with enterprise-grade security and privacy measures",
      color: "from-indigo-500 to-blue-600",
      bgColor: "bg-indigo-500/10",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Award Winning",
      description: "Recognized globally for excellence in travel technology and user experience",
      color: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-500/10",
    },
  ]

  const processSteps = [
    {
      step: "01",
      title: "Share Your Dreams",
      description: "Tell us about your ideal destination, budget, interests, and travel preferences",
      icon: <Target className="w-8 h-8" />,
      color: "from-pink-500 to-rose-600",
      details: ["Destination preferences", "Budget planning", "Travel style", "Group size"],
    },
    {
      step: "02",
      title: "AI Magic Happens",
      description: "Our advanced AI analyzes millions of data points to craft your perfect journey",
      icon: <Zap className="w-8 h-8" />,
      color: "from-yellow-500 to-orange-600",
      details: ["Smart recommendations", "Weather optimization", "Local events", "Best prices"],
    },
    {
      step: "03",
      title: "Get Your Plan",
      description: "Receive a detailed, personalized itinerary with bookings and local insights",
      icon: <Rocket className="w-8 h-8" />,
      color: "from-purple-500 to-violet-600",
      details: ["Complete itinerary", "Booking assistance", "Local tips", "24/7 support"],
    },
    {
      step: "04",
      title: "Travel & Share",
      description: "Embark on your journey and share your experiences with the travel community",
      icon: <TrendingUp className="w-8 h-8" />,
      color: "from-emerald-500 to-teal-600",
      details: ["Live updates", "Photo sharing", "Review system", "Travel memories"],
    },
  ]

  const quickActions = [
    {
      title: "Plan Your Trip",
      description: "Create AI-powered itineraries",
      icon: <Plane className="w-6 h-6" />,
      action: () => navigate(user ? "/trip-planner" : "/login"),
      color: "from-blue-500 to-purple-600",
    },
    {
      title: "Browse Reviews",
      description: "Read traveler experiences",
      icon: <Star className="w-6 h-6" />,
      action: () => navigate("/reviews"),
      color: "from-yellow-500 to-orange-600",
    },
    {
      title: "Social Travel",
      description: "Connect with travelers",
      icon: <Users className="w-6 h-6" />,
      action: () => navigate(user ? "/social-travel" : "/login"),
      color: "from-green-500 to-teal-600",
    },
    {
      title: "Public Trips",
      description: "Explore shared itineraries",
      icon: <Globe className="w-6 h-6" />,
      action: () => navigate(user ? "/public-trips" : "/login"),
      color: "from-pink-500 to-rose-600",
    },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* STUNNING VIBRANT SPACE BACKGROUND */}
      <div className="fixed inset-0 z-0">
        {/* VIBRANT COSMIC BASE - Much More Attractive */}
        <div className="absolute inset-0">
          {/* Rich Deep Space Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-800 via-violet-700 to-fuchsia-800"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-cyan-800 via-blue-700 to-indigo-800"></div>

          {/* Vibrant Aurora Effects */}
          <div className="absolute inset-0 opacity-60">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-400/20 via-transparent to-blue-400/20 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-l from-pink-400/20 via-transparent to-purple-400/20 animate-pulse delay-1000"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-yellow-400/15 via-transparent to-orange-400/15 animate-pulse delay-2000"></div>
          </div>

          {/* Dynamic Cosmic Waves */}
          <div className="absolute inset-0 opacity-30">
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 1200px 600px at 20% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
                  radial-gradient(ellipse 800px 400px at 80% 30%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
                  radial-gradient(ellipse 1000px 500px at 50% 80%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
                  radial-gradient(ellipse 600px 300px at 10% 70%, rgba(34, 197, 94, 0.4) 0%, transparent 50%),
                  radial-gradient(ellipse 900px 450px at 90% 90%, rgba(251, 191, 36, 0.4) 0%, transparent 50%)
                `,
                animation: "cosmicWave 20s ease-in-out infinite alternate",
              }}
            ></div>
          </div>

          {/* Brilliant Star Clusters */}
          <div className="absolute inset-0 opacity-80">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(3px 3px at 25px 35px, #ffffff, transparent),
                  radial-gradient(2px 2px at 85px 45px, #60a5fa, transparent),
                  radial-gradient(4px 4px at 145px 25px, #34d399, transparent),
                  radial-gradient(2px 2px at 195px 85px, #f472b6, transparent),
                  radial-gradient(3px 3px at 245px 45px, #fbbf24, transparent),
                  radial-gradient(2px 2px at 295px 75px, #a78bfa, transparent),
                  radial-gradient(4px 4px at 65px 125px, #06b6d4, transparent),
                  radial-gradient(3px 3px at 185px 135px, #f97316, transparent),
                  radial-gradient(2px 2px at 125px 165px, #ec4899, transparent),
                  radial-gradient(3px 3px at 275px 155px, #10b981, transparent)
                `,
                backgroundRepeat: "repeat",
                backgroundSize: "300px 200px",
                animation: "starTwinkle 3s ease-in-out infinite alternate",
              }}
            ></div>
          </div>

          {/* Spectacular Nebula Clouds */}
          <div className="absolute inset-0 opacity-40">
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 1500px 800px at 30% 40%, rgba(139, 92, 246, 0.6) 0%, rgba(59, 130, 246, 0.3) 30%, transparent 70%),
                  radial-gradient(ellipse 1200px 600px at 70% 60%, rgba(236, 72, 153, 0.6) 0%, rgba(251, 113, 133, 0.3) 30%, transparent 70%),
                  radial-gradient(ellipse 1000px 500px at 10% 80%, rgba(34, 197, 94, 0.6) 0%, rgba(16, 185, 129, 0.3) 30%, transparent 70%),
                  radial-gradient(ellipse 800px 400px at 90% 20%, rgba(251, 191, 36, 0.6) 0%, rgba(245, 158, 11, 0.3) 30%, transparent 70%)
                `,
                animation: "nebulaFloat 25s ease-in-out infinite",
              }}
            ></div>
          </div>

          {/* Futuristic Energy Grid */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px),
                  linear-gradient(45deg, rgba(236, 72, 153, 0.3) 1px, transparent 1px),
                  linear-gradient(-45deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: "120px 120px, 120px 120px, 80px 80px, 80px 80px",
                animation: "energyGrid 15s linear infinite",
              }}
            ></div>
          </div>

          {/* Floating Energy Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/30 to-rose-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
          <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-gradient-to-r from-yellow-400/25 to-orange-500/25 rounded-full blur-3xl animate-pulse delay-3000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-r from-cyan-400/25 to-blue-500/25 rounded-full blur-3xl animate-pulse delay-4000"></div>

          {/* Cosmic Lightning Effects */}
          <div className="absolute inset-0 opacity-25">
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(45deg, transparent 40%, rgba(59, 130, 246, 0.8) 50%, transparent 60%),
                  linear-gradient(-45deg, transparent 45%, rgba(236, 72, 153, 0.8) 50%, transparent 55%),
                  linear-gradient(90deg, transparent 48%, rgba(34, 197, 94, 0.8) 50%, transparent 52%),
                  linear-gradient(135deg, transparent 47%, rgba(251, 191, 36, 0.8) 50%, transparent 53%)
                `,
                backgroundSize: "200px 200px, 250px 250px, 300px 300px, 180px 180px",
                animation: "cosmicLightning 8s ease-in-out infinite alternate",
              }}
            ></div>
          </div>
        </div>

        {/* BACKGROUND IMAGE OVERLAY */}
        <div className="absolute inset-0 transition-opacity duration-1000">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
            style={{
              backgroundImage: `url(${bgImage})`,
              filter: "brightness(0.7) contrast(1.2) saturate(1.3)",
            }}
          ></div>
          {/* Enhanced blend overlay for perfect integration */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-transparent to-indigo-900/60"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-800/30 via-transparent to-pink-800/30"></div>
        </div>

        {/* Cinematic Depth Vignette */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40"></div>
      </div>

      {/* Enhanced CSS for Vibrant Space Animations */}
      <style jsx>{`
        @keyframes cosmicWave {
          0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
          50% { transform: translateY(-30px) scale(1.1) rotate(5deg); }
        }
        @keyframes starTwinkle {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes nebulaFloat {
          0%, 100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
          25% { transform: translateX(20px) translateY(-15px) rotate(2deg); }
          50% { transform: translateX(-10px) translateY(-25px) rotate(-1deg); }
          75% { transform: translateX(-20px) translateY(10px) rotate(3deg); }
        }
        @keyframes energyGrid {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(120px, 120px) rotate(360deg); }
        }
        @keyframes cosmicLightning {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.05); }
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/30 rounded-full px-8 py-3 mb-8 shadow-2xl">
                <Sparkles className="w-6 h-6 text-blue-400" />
                <span className="text-white font-semibold text-lg">Next-Generation Travel Platform</span>
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>

              <h1 className="text-7xl md:text-9xl font-black mb-8 leading-tight">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
                  Smart
                </span>
                <br />
                <span className="text-white drop-shadow-2xl">Travel</span>
              </h1>

              <p className="text-2xl md:text-3xl text-gray-100 mb-12 max-w-5xl mx-auto leading-relaxed font-light">
                Experience the future of travel planning with our{" "}
                <span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-semibold">
                  AI-powered platform
                </span>{" "}
                that creates personalized adventures tailored to your soul.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-20"
            >
              <button
                onClick={() => navigate(user ? "/trip-planner" : "/login")}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-6 rounded-3xl font-bold text-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 flex items-center space-x-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Rocket className="w-7 h-7 relative z-10" />
                <span className="relative z-10">{user ? "Start Your Journey" : "Begin Adventure"}</span>
                <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
              </button>

              {user && (
                <button
                  onClick={() => navigate("/my-trips")}
                  className="bg-white/20 backdrop-blur-xl text-white border-2 border-white/30 px-12 py-6 rounded-3xl font-bold text-xl hover:bg-white/30 transition-all duration-300 flex items-center space-x-4 shadow-2xl"
                >
                  <Navigation className="w-7 h-7" />
                  <span>My Adventures</span>
                </button>
              )}
            </motion.div>

            {/* Enhanced Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-20"
            >
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="group relative bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                >
                  <div
                    className={`w-20 h-20 bg-gradient-to-r ${action.color} rounded-3xl flex items-center justify-center text-white mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-2xl`}
                  >
                    {action.icon}
                  </div>
                  <h3 className="font-bold text-white mb-3 text-lg">{action.title}</h3>
                  <p className="text-gray-200 text-sm leading-relaxed">{action.description}</p>
                </button>
              ))}
            </motion.div>

            {/* Enhanced Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-10 max-w-7xl mx-auto"
            >
              <div className="text-center group">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stats.totalTrips}+
                </div>
                <div className="text-gray-200 font-medium text-lg">Epic Journeys</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stats.happyTravelers}+
                </div>
                <div className="text-gray-200 font-medium text-lg">Happy Explorers</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stats.destinations}+
                </div>
                <div className="text-gray-200 font-medium text-lg">Dream Destinations</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stats.avgRating}
                </div>
                <div className="text-gray-200 font-medium text-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-2" />
                  User Rating
                </div>
              </div>
              <div className="text-center group">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stats.totalReviews}+
                </div>
                <div className="text-gray-200 font-medium text-lg">Amazing Stories</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 relative z-10 bg-gradient-to-b from-black/20 to-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-white/30 rounded-full px-8 py-3 mb-8 shadow-2xl">
                <PlayCircle className="w-6 h-6 text-emerald-400" />
                <span className="text-emerald-300 font-semibold text-lg">Your Journey Starts Here</span>
              </div>
              <h2 className="text-6xl md:text-7xl font-black text-white mb-8">
                How It{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Works
                </span>
              </h2>
              <p className="text-2xl text-gray-200 max-w-4xl mx-auto font-light">
                Transform your travel dreams into reality with our revolutionary four-step process
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 hover:border-white/40 transition-all duration-300 group hover:shadow-2xl">
                  <div className="flex items-start space-x-8">
                    <div className="relative">
                      <div
                        className={`w-24 h-24 bg-gradient-to-r ${step.color} rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl group-hover:scale-110 transition-transform duration-300`}
                      >
                        {step.step}
                      </div>
                      <div
                        className={`absolute top-3 left-3 w-18 h-18 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center text-white opacity-30`}
                      >
                        {step.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-white mb-4">{step.title}</h3>
                      <p className="text-gray-200 text-xl mb-8 leading-relaxed">{step.description}</p>
                      <div className="grid grid-cols-2 gap-4">
                        {step.details.map((detail, i) => (
                          <div key={i} className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-gray-300 font-medium">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-32 relative z-10 bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-6xl md:text-7xl font-black text-white mb-8">
                Powerful{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Features
                </span>
              </h2>
              <p className="text-2xl text-gray-200 max-w-4xl mx-auto font-light">
                Discover cutting-edge features designed to revolutionize your travel experience
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`group relative ${feature.bgColor} backdrop-blur-xl border border-white/20 rounded-3xl p-10 hover:border-white/40 transition-all duration-300 hover:shadow-2xl hover:scale-105`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div
                    className={`inline-flex p-5 rounded-3xl bg-gradient-to-r ${feature.color} text-white mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-5">{feature.title}</h3>
                  <p className="text-gray-200 text-lg leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Reviews Section with Predefined Fallbacks */}
      <section className="py-32 relative z-10 bg-gradient-to-b from-black/60 to-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-white/30 rounded-full px-8 py-3 mb-8 shadow-2xl">
                <MessageSquare className="w-6 h-6 text-orange-400" />
                <span className="text-orange-300 font-semibold text-lg">Real Traveler Stories</span>
              </div>
              <h2 className="text-6xl md:text-7xl font-black text-white mb-8">
                What Travelers{" "}
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Say</span>
              </h2>
              <p className="text-2xl text-gray-200 max-w-4xl mx-auto mb-12 font-light">
                Authentic experiences from real travelers who have transformed their journeys with us
              </p>
              <button
                onClick={() => navigate("/reviews")}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 flex items-center space-x-3 mx-auto transform hover:scale-105"
              >
                <MessageSquare className="w-6 h-6" />
                <span>Explore All Reviews</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-400"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {realReviews.map((review, index) => (
                <motion.div
                  key={review.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:border-white/40 transition-all duration-300 group hover:shadow-2xl hover:scale-105"
                >
                  <div className="flex items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-5 shadow-lg">
                      {review.user_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{review.user_name || "Anonymous Traveler"}</h4>
                      <p className="text-gray-200 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {review.destination || "Amazing Destination"}
                      </p>
                    </div>
                  </div>
                  <div className="flex mb-6">
                    {[...Array(review.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-200 italic leading-relaxed text-lg mb-6">
                    "{review.review_text || "An incredible travel experience!"}"
                  </p>
                  <div className="text-sm text-gray-400 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : "Recently"}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Write Review CTA */}
          <div className="text-center mt-16">
            <button
              onClick={handleWriteReview}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all duration-300 flex items-center space-x-3 mx-auto transform hover:scale-105"
            >
              <Edit3 className="w-6 h-6" />
              <span>Share Your Experience</span>
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-32 relative z-10 bg-gradient-to-b from-black/80 to-black backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-6xl md:text-7xl font-black text-white mb-8">
                Get In{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                  Touch
                </span>
              </h2>
              <p className="text-2xl text-gray-200 max-w-4xl mx-auto font-light">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10"
            >
              <h3 className="text-3xl font-bold text-white mb-8">Send us a message</h3>

              {submitMessage && (
                <div
                  className={`mb-6 p-4 rounded-xl ${submitMessage.includes("Thank you") ? "bg-green-500/20 border border-green-500/30 text-green-300" : "bg-red-500/20 border border-red-500/30 text-red-300"}`}
                >
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-3">Name</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="Your full name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-3">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="your.email@example.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-3">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={6}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                    placeholder="Tell us how we can help you..."
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center space-x-3 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Email Us</h4>
                    <p className="text-gray-200">We'll respond within 24 hours</p>
                  </div>
                </div>
                <p className="text-blue-400 font-medium text-lg">sdsuperstar@gmail.com</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Call Us</h4>
                    <p className="text-gray-200">Mon-Fri from 8am to 5pm</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-green-400 font-medium text-lg">+91 8099160577</p>
                  <p className="text-green-400 font-medium text-lg">+91 7396160577</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
                <h4 className="text-xl font-bold text-white mb-6">Follow Us</h4>
                <div className="flex space-x-4">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Facebook className="w-6 h-6 text-white" />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Twitter className="w-6 h-6 text-white" />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Instagram className="w-6 h-6 text-white" />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Linkedin className="w-6 h-6 text-white" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 bg-black">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="bg-gradient-to-r from-white/10 to-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-16 shadow-2xl">
              <h2 className="text-6xl md:text-7xl font-black text-white mb-8">
                Ready to{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Explore
                </span>
                ?
              </h2>
              <p className="text-2xl text-gray-200 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                Join thousands of adventurers who have discovered their perfect journeys with our revolutionary
                platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-8 justify-center">
                <button
                  onClick={() => navigate(user ? "/trip-planner" : "/login")}
                  className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-6 rounded-3xl font-bold text-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 flex items-center space-x-4 mx-auto sm:mx-0 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Rocket className="w-7 h-7 relative z-10" />
                  <span className="relative z-10">{user ? "Start Your Adventure" : "Begin Your Journey"}</span>
                  <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                </button>
                <button
                  onClick={() => navigate("/reviews")}
                  className="bg-white/20 backdrop-blur-xl text-white border-2 border-white/30 px-12 py-6 rounded-3xl font-bold text-xl hover:bg-white/30 transition-all duration-300 flex items-center space-x-4 mx-auto sm:mx-0 shadow-2xl"
                >
                  <Heart className="w-7 h-7" />
                  <span>Share Your Story</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-3xl font-black text-white mb-6">Smart Travel</h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-md">
                Revolutionizing travel planning with AI-powered personalization. Your next adventure is just a click
                away.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Facebook className="w-6 h-6 text-white" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Twitter className="w-6 h-6 text-white" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Instagram className="w-6 h-6 text-white" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Linkedin className="w-6 h-6 text-white" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-bold text-white mb-6">Quick Links</h4>
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={() => navigate(user ? "/trip-planner" : "/login")}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    Trip Planner
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/reviews")}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    Reviews
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(user ? "/social-travel" : "/login")}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    Social Travel
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(user ? "/public-trips" : "/login")}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    Public Trips
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(user ? "/my-trips" : "/login")}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    My Account
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xl font-bold text-white mb-6">Support</h4>
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={() => navigate("/help")}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <a href="mailto:sdsuperstar@gmail.com" className="text-gray-300 hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/privacy")}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/terms")}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/faq")}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-12 pt-8 text-center">
            <p className="text-gray-300">
              © 2024 Smart Travel. All rights reserved. Made with ❤️ for travelers worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
