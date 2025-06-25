"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Star,
  Camera,
  Utensils,
  Car,
  Plane,
  ExternalLink,
  Navigation,
  Globe,
  ImageIcon,
  Building,
  ShoppingBag,
  Sunset,
  Cloud,
  Sun,
  CloudRain,
  Lightbulb,
  Landmark,
} from "lucide-react"
import deepseekapi from "../Services/deepseekapi"
import placesapi from "../Services/places-service"
import weatherapi from "../Services/weatherapi"

export default function TripPlanGeneration({ tripData, updateTripData, onNext, onPrev }) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [tripPlan, setTripPlan] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const [dayWiseHotels, setDayWiseHotels] = useState({})
  const [error, setError] = useState(null)
  const [hoveredActivity, setHoveredActivity] = useState(null)
  const [weatherData, setWeatherData] = useState(null)

  const steps = [
    "🤖 AI analyzing your travel preferences and budget...",
    "🌤️ Fetching weather data for your travel dates...",
    "🗺️ Creating complete itinerary for all days...",
    "🏨 Finding unique hotels for your entire trip...",
    "📅 Organizing your perfect daily schedule...",
    "🛣️ Optimizing routes and travel times...",
    "✨ Finalizing your AI-powered journey...",
  ]

  useEffect(() => {
    generateCompleteTripPlan()
  }, [])

  // Calculate trip start date
  const getTripStartDate = () => {
    if (tripData.travelDates?.startDate) {
      return new Date(tripData.travelDates.startDate)
    }
    // Default to today if no start date provided
    return new Date()
  }

  // Check if special interest should be ignored
  const shouldIgnoreSpecialInterest = () => {
    if (!tripData.specialInterest) return true

    const interest = tripData.specialInterest.trim().toLowerCase()
    return (
      interest === "" ||
      interest === "no" ||
      interest === "n/a" ||
      interest === "no special interest" ||
      interest === "none"
    )
  }

  const generateCompleteTripPlan = async () => {
    setGenerating(true)
    setError(null)

    try {
      // Step 1: AI Analysis
      setCurrentStep(steps[0])
      setProgress(12.5)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Step 2: Fetch Weather Data (based on start date)
      setCurrentStep(steps[1])
      setProgress(25)
      const weatherData = await fetchWeatherDataForTripDates()

      // Step 3: Remove weather suggestions generation step
      setCurrentStep(steps[2])
      setProgress(37.5)

      // Step 4: Generate COMPLETE Trip Plan in ONE API call
      setCurrentStep(steps[3])
      setProgress(50)
      const completeTripPlan = await generateCompleteTripPlanInOneCall(weatherData, null) // Pass null instead of weatherSuggestions

      // Step 5: Generate ALL Hotels in ONE API call
      setCurrentStep(steps[4])
      setProgress(62.5)
      const allHotelsData = await generateAllHotelsInOneCall(completeTripPlan.days)

      // Step 6: Organize and format data
      setCurrentStep(steps[5])
      setProgress(75)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Step 7: Route optimization
      setCurrentStep(steps[6])
      setProgress(87.5)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Step 8: Finalize
      setCurrentStep(steps[7])
      setProgress(100)

      const finalPlan = {
        ...completeTripPlan,
        dayWiseAccommodations: allHotelsData,
        weatherData: weatherData,
        generatedAt: new Date().toISOString(),
        isAIGenerated: true,
        tripDataUsed: tripData,
      }

      setTripPlan(finalPlan)
      setDayWiseHotels(allHotelsData)
      updateTripData({ tripPlan: finalPlan })
    } catch (error) {
      console.error("Error generating AI trip plan:", error)
      setError("Failed to generate your perfect trip plan. Please try again.")
    }

    setGenerating(false)
  }

  const fetchWeatherDataForTripDates = async () => {
    try {
      const startDate = getTripStartDate()
      // Use the correct weather API method - likely getWeather instead of getWeatherForDate
      const weather = await weatherapi.getWeather(tripData.destination)
      setWeatherData(weather)
      console.log("Weather data fetched:", weather)
      return weather
    } catch (error) {
      console.error("Error fetching weather data:", error)
      // Fallback weather data
      const fallbackData = {
        location: tripData.destination,
        temperature: 25,
        condition: "partly cloudy",
        icon: null,
        date: getTripStartDate().toISOString(),
      }
      setWeatherData(fallbackData)
      return fallbackData
    }
  }

  // SUPER OPTIMIZED: Generate complete trip plan in ONE API call
  const generateCompleteTripPlanInOneCall = async (weatherData, weatherSuggestions) => {
    const startDate = getTripStartDate()
    const weatherContext = weatherData
      ? `
  WEATHER CONDITIONS FOR TRIP:
  - Location: ${weatherData.location}
  - Temperature: ${weatherData.temperature}°C
  - Condition: ${weatherData.condition}
  - Start Date: ${startDate.toDateString()}
  `
      : ""

    // Format user preferences
    const interestsContext =
      tripData.interests && tripData.interests.length > 0
        ? `
  USER INTERESTS & PASSIONS:
  - Selected Interests: ${tripData.interests.join(", ")}
  - Focus on activities related to: ${tripData.interests.join(", ")}
  - Prioritize attractions and experiences that match these interests
  `
        : ""

    const foodContext =
      tripData.foodPreferences && tripData.foodPreferences.length > 0
        ? `
  CULINARY PREFERENCES:
  - Food Preferences: ${tripData.foodPreferences.join(", ")}
  - Restaurant recommendations should align with: ${tripData.foodPreferences.join(", ")}
  - Include dining experiences that match these preferences
  `
        : ""

    // Add special interest context if it shouldn't be ignored
    const specialInterestContext = !shouldIgnoreSpecialInterest()
      ? `
  SPECIAL INTEREST FOCUS:
  - The traveler has a SPECIAL INTEREST in: "${tripData.specialInterest}"
  - This trip should PRIMARILY focus on this special interest
  - Make this special interest the MAIN THEME of the trip
  - Prioritize activities, attractions, and experiences related to this special interest
  - Ensure each day includes at least one activity related to this special interest
  `
      : ""

    const megaPrompt = `You are an expert travel planner. Create a complete ${tripData.days}-day trip itinerary for ${tripData.destination}.

  TRIP DETAILS:
  - Destination: ${tripData.destination}
  - Duration: ${tripData.days} days
  - Budget: ₹${tripData.budget}
  - Travelers: ${tripData.travelers || 1}
  - Start Date: ${startDate.toDateString()}
  - Transport: ${tripData.selectedTransport?.type || "Mixed transport"}
  ${weatherContext}${specialInterestContext}${interestsContext}${foodContext}

  PERSONALIZATION REQUIREMENTS:
  ${
    !shouldIgnoreSpecialInterest()
      ? `
  - HIGHEST PRIORITY: Focus on the traveler's special interest: "${tripData.specialInterest}"
  - Make this special interest the central theme of the trip
  - Each day should feature at least one activity related to this special interest
  `
      : ""
  }
  ${
    tripData.interests && tripData.interests.length > 0
      ? `
  - MUST include activities related to user's interests: ${tripData.interests.join(", ")}
  - Prioritize attractions that match: ${tripData.interests.join(", ")}
  - If destination doesn't have specific interest-based activities, include closest alternatives
  `
      : ""
  }
  ${
    tripData.foodPreferences && tripData.foodPreferences.length > 0
      ? `
  - MUST include restaurants/food experiences matching: ${tripData.foodPreferences.join(", ")}
  - Recommend dining options that align with: ${tripData.foodPreferences.join(", ")}
  - If specific cuisine isn't available, suggest local alternatives that match dietary preferences
  `
      : ""
  }

  GENERATE COMPLETE ITINERARY:
  Return ONLY a valid JSON object with this EXACT structure:
  {
    "summary": "Compelling 3-4 sentence trip summary highlighting unique experiences and value, mentioning how it caters to user's interests and food preferences",
    "days": [
      {
        "day": 1,
        "title": "Day 1 - Arrival & First Impressions",
        "theme": "Getting oriented and first taste of the destination",
        "activities": [
          {
            "time": "8:00 AM",
            "activity": "Specific real attraction/restaurant name",
            "location": "Exact address or landmark in ${tripData.destination}",
            "description": "Detailed 2-3 sentence description with highlights, mention if it matches user interests/food preferences",
            "cost": 800,
            "duration": "2 hours",
            "type": "sightseeing",
            "coordinates": "lat,lng if available",
            "tips": "Specific practical tip for visitors",
            "weatherSuitable": true,
            "matchesInterests": ["interest1", "interest2"],
            "matchesFoodPrefs": ["food_pref1"],
            "matchesSpecialInterest": ${!shouldIgnoreSpecialInterest() ? "true" : "false"}
          }
        ],
        "totalCost": 3500,
        "highlights": ["Top 3 activities of the day"],
        "weatherConsiderations": "Weather-specific notes for this day",
        "personalizedNote": "How this day caters to user's specific interests and food preferences"
      }
    ],
    "totalCost": 25000,
    "insights": ["Travel insight 1", "Travel insight 2", "Travel insight 3"],
    "culturalTips": ["Cultural tip 1", "Cultural tip 2", "Cultural tip 3"],
    "budgetBreakdown": {
      "accommodation": 15000,
      "food": 8000,
      "activities": 12000,
      "transport": 5000
    },
    "personalizationSummary": {
      "specialInterestMatched": ${!shouldIgnoreSpecialInterest() ? `"How the trip focuses on the special interest: ${tripData.specialInterest}"` : "null"},
      "interestsMatched": ["list of user interests that were incorporated"],
      "foodPrefsMatched": ["list of food preferences that were incorporated"],
      "alternativesProvided": ["list of alternatives when exact preferences weren't available"]
    }
  }

  REQUIREMENTS:
  - Generate ALL ${tripData.days} days in this single response
  - Each day should have 6-8 activities from 8:00 AM to 9:00 PM
  - Use REAL attraction names, restaurant names, and locations in ${tripData.destination}
  - Include variety: sightseeing, food, cultural, shopping, adventure, relaxation
  - Weather-optimize activities based on ${weatherData?.condition || "seasonal weather"}
  ${
    !shouldIgnoreSpecialInterest() ? `- TOP PRIORITY: Focus on the special interest: "${tripData.specialInterest}"` : ""
  }
  - PRIORITIZE activities matching user interests: ${tripData.interests?.join(", ") || "general tourism"}
  - PRIORITIZE restaurants matching food preferences: ${tripData.foodPreferences?.join(", ") || "local cuisine"}
  - Realistic costs in INR for ${tripData.destination}
  - Specific addresses and landmarks
  - Make each day unique and exciting
  - Total budget should not exceed ₹${tripData.budget}
  - If user's specific interests/food preferences aren't available, provide closest alternatives and mention this

  ACTIVITY TYPES: sightseeing, food, cultural, shopping, adventure, relaxation

  ${
    !shouldIgnoreSpecialInterest()
      ? `SPECIAL INTEREST FOCUS: "${tripData.specialInterest}" should be the primary focus of this trip`
      : ""
  }
  INTEREST MATCHING: ${tripData.interests?.length > 0 ? `Focus heavily on: ${tripData.interests.join(", ")}` : "Include diverse experiences"}
  FOOD MATCHING: ${tripData.foodPreferences?.length > 0 ? `Prioritize: ${tripData.foodPreferences.join(", ")}` : "Include local cuisine variety"}`

    try {
      const response = await deepseekapi.getResponse(megaPrompt)
      const jsonMatch = response.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const parsedPlan = JSON.parse(jsonMatch[0])

        // Validate and enhance the parsed plan
        const enhancedPlan = {
          destination: tripData.destination,
          duration: tripData.days,
          budget: tripData.budget,
          travelers: tripData.travelers,
          specialInterest: !shouldIgnoreSpecialInterest() ? tripData.specialInterest : null,
          summary:
            parsedPlan.summary ||
            `Your expertly crafted ${tripData.days}-day journey through ${tripData.destination} combines must-see attractions with hidden local gems.`,
          days: parsedPlan.days || [],
          totalEstimatedCost: parsedPlan.totalCost || Math.floor(tripData.budget * 0.9),
          insights: parsedPlan.insights || [
            `Personalized ${tripData.days}-day journey through ${tripData.destination}`,
          ],
          culturalTips: parsedPlan.culturalTips || [`Respect local customs in ${tripData.destination}`],
          budgetBreakdown: parsedPlan.budgetBreakdown || {
            accommodation: Math.floor(tripData.budget * 0.4),
            food: Math.floor(tripData.budget * 0.25),
            activities: Math.floor(tripData.budget * 0.25),
            transport: Math.floor(tripData.budget * 0.1),
          },
          personalizationSummary: parsedPlan.personalizationSummary || {},
          aiGenerated: true,
        }

        return enhancedPlan
      }
    } catch (error) {
      console.error("Error parsing mega trip plan:", error)
    }

    // Fallback: Generate a basic structure
    return await generateFallbackTripPlan(weatherData)
  }

  // SUPER OPTIMIZED: Generate ALL hotels for ALL days in ONE API call
  const generateAllHotelsInOneCall = async (days) => {
    const accommodationBudget = Math.floor(tripData.budget * 0.4)
    const pricePerNight = Math.floor(accommodationBudget / tripData.days)

    // Include special interest in hotel prompt if applicable
    const specialInterestHotelContext = !shouldIgnoreSpecialInterest()
      ? `
    SPECIAL INTEREST CONSIDERATION:
    - The traveler has a special interest in: "${tripData.specialInterest}"
    - If possible, include hotels that cater to or are related to this special interest
    - Examples: themed hotels, hotels near relevant attractions, hotels with facilities related to the interest
    `
      : ""

    const hotelMegaPrompt = `Generate ${tripData.days * 3} unique hotels in ${tripData.destination} for a ${tripData.days}-day trip.

    REQUIREMENTS:
    - ${tripData.days * 3} DIFFERENT hotel names (3 per day)
    - All hotels must be REAL and exist in ${tripData.destination}
    - Price range: ₹${Math.floor(pricePerNight * 0.8)}-₹${Math.floor(pricePerNight * 1.2)} per night
    - NO DUPLICATE hotel names
    - Include exact addresses
    - Variety of hotel types (luxury, mid-range, boutique, etc.)
    ${specialInterestHotelContext}

    Return ONLY valid JSON array:
    [
      {
        "name": "Real Hotel Name in ${tripData.destination}",
        "address": "Complete address with area, ${tripData.destination}",
        "price": 8000,
        "amenities": ["Swimming Pool", "Spa", "Restaurant", "Free WiFi", "Fitness Center", "Room Service"],
        "description": "Brief 1-2 sentence description highlighting unique features",
        "hotelType": "luxury/mid-range/boutique/budget",
        "nearbyArea": "Popular area/landmark in ${tripData.destination}"
      }
    ]

    Generate exactly ${tripData.days * 3} unique hotels with no repetitions.`

    try {
      const response = await deepseekapi.getResponse(hotelMegaPrompt)
      const jsonMatch = response.match(/\[[\s\S]*\]/)

      if (jsonMatch) {
        const allHotels = JSON.parse(jsonMatch[0])

        // Distribute hotels across days (3 per day)
        const dayWiseHotels = {}
        let hotelIndex = 0

        for (let dayNum = 1; dayNum <= tripData.days; dayNum++) {
          dayWiseHotels[dayNum] = []

          for (let i = 0; i < 3 && hotelIndex < allHotels.length; i++) {
            const hotel = allHotels[hotelIndex]
            const hotelImages = await getHotelImages(hotel.name, tripData.destination)

            dayWiseHotels[dayNum].push({
              id: `day${dayNum}_hotel_${i}`,
              name: hotel.name,
              address: hotel.address,
              rating: (4.0 + Math.random() * 1.0).toFixed(1),
              estimatedPrice: hotel.price || Math.floor(pricePerNight * (0.8 + Math.random() * 0.4)),
              amenities: hotel.amenities || generatePremiumAmenities(),
              description: hotel.description || `Quality accommodation in ${tripData.destination}`,
              images: hotelImages,
              thumbnail: hotelImages[0],
              isTopRated: Math.random() > 0.4,
              withinBudget: true,
              dayNumber: dayNum,
              hotelType: hotel.hotelType || "mid-range",
              nearbyArea: hotel.nearbyArea || tripData.destination,
              searchQuery: `${hotel.name} ${tripData.destination}`,
            })

            hotelIndex++
          }
        }

        return dayWiseHotels
      }
    } catch (error) {
      console.error("Error generating all hotels:", error)
    }

    // Fallback: Generate basic hotel structure
    return await generateFallbackHotels(days)
  }

  // Fallback trip plan generator
  const generateFallbackTripPlan = async (weatherData) => {
    const dailyBudget = Math.floor((tripData.budget * 0.6) / tripData.days)
    const days = []

    for (let i = 1; i <= tripData.days; i++) {
      const timeSlots = ["8:00 AM", "10:30 AM", "1:00 PM", "3:30 PM", "6:00 PM", "8:00 PM"]
      const activities = timeSlots.map((time, idx) => ({
        time,
        activity: `${tripData.destination} Experience ${idx + 1}`,
        location: `${tripData.destination} Location ${idx + 1}`,
        description: `Discover the beauty of ${tripData.destination} with this carefully curated experience.`,
        cost: Math.floor(dailyBudget / 6),
        duration: ["1.5 hours", "2 hours", "2.5 hours"][idx % 3],
        type: ["sightseeing", "food", "cultural", "shopping", "adventure", "relaxation"][idx % 6],
        coordinates: null,
        tips: `Best visited during ${time.includes("AM") ? "morning" : "evening"} hours.`,
        weatherSuitable: true,
        matchesSpecialInterest: !shouldIgnoreSpecialInterest() && idx === 0, // Mark first activity as matching special interest
      }))

      days.push({
        day: i,
        title: `Day ${i} - ${tripData.destination} ${i === 1 ? "Arrival" : i === tripData.days ? "Departure" : "Exploration"}`,
        theme: `Curated ${tripData.destination} Experience`,
        activities,
        totalCost: activities.reduce((sum, act) => sum + act.cost, 0),
        highlights: activities.slice(0, 3).map((a) => a.activity),
        weatherConsiderations: weatherData
          ? `Optimized for ${weatherData.condition} weather`
          : "Weather-adaptive planning",
        personalizedNote: !shouldIgnoreSpecialInterest()
          ? `This day includes activities focused on your special interest: ${tripData.specialInterest}`
          : null,
      })
    }

    return {
      destination: tripData.destination,
      duration: tripData.days,
      budget: tripData.budget,
      travelers: tripData.travelers,
      specialInterest: !shouldIgnoreSpecialInterest() ? tripData.specialInterest : null,
      summary: !shouldIgnoreSpecialInterest()
        ? `Your expertly crafted ${tripData.days}-day journey through ${tripData.destination} focuses on your special interest in ${tripData.specialInterest}, combining must-see attractions with unique experiences tailored to your passion.`
        : `Your expertly crafted ${tripData.days}-day journey through ${tripData.destination} combines must-see attractions with hidden local gems.`,
      days,
      totalEstimatedCost: days.reduce((sum, day) => sum + day.totalCost, 0),
      insights: [`Personalized ${tripData.days}-day journey through ${tripData.destination}`],
      culturalTips: [`Respect local customs in ${tripData.destination}`],
      budgetBreakdown: {
        accommodation: Math.floor(tripData.budget * 0.4),
        food: Math.floor(tripData.budget * 0.25),
        activities: Math.floor(tripData.budget * 0.25),
        transport: Math.floor(tripData.budget * 0.1),
      },
      personalizationSummary: {
        specialInterestMatched: !shouldIgnoreSpecialInterest()
          ? `Trip focused on your special interest: ${tripData.specialInterest}`
          : null,
        interestsMatched: tripData.interests || [],
        foodPrefsMatched: tripData.foodPreferences || [],
      },
      aiGenerated: true,
    }
  }

  // Fallback hotel generator
  const generateFallbackHotels = async (days) => {
    const dayWiseHotels = {}
    const pricePerNight = Math.floor((tripData.budget * 0.4) / tripData.days)

    for (let dayNum = 1; dayNum <= tripData.days; dayNum++) {
      dayWiseHotels[dayNum] = []

      for (let i = 0; i < 3; i++) {
        const hotelImages = await getHotelImages(`Hotel ${dayNum}-${i}`, tripData.destination)

        dayWiseHotels[dayNum].push({
          id: `day${dayNum}_hotel_${i}`,
          name: `Premium Hotel ${dayNum}-${i + 1} ${tripData.destination}`,
          address: `${tripData.destination} Premium Location ${i + 1}`,
          rating: (4.0 + Math.random() * 1.0).toFixed(1),
          estimatedPrice: Math.floor(pricePerNight * (0.8 + Math.random() * 0.4)),
          amenities: generatePremiumAmenities(),
          description: `Quality accommodation in ${tripData.destination} with excellent facilities.`,
          images: hotelImages,
          thumbnail: hotelImages[0],
          isTopRated: Math.random() > 0.4,
          withinBudget: true,
          dayNumber: dayNum,
          searchQuery: `Premium Hotel ${dayNum}-${i + 1} ${tripData.destination}`,
        })
      }
    }

    return dayWiseHotels
  }

  const getHotelImages = async (hotelName, destination) => {
    try {
      const isResort = hotelName.toLowerCase().includes("resort")
      const isPalace = hotelName.toLowerCase().includes("palace")
      const isLuxury = hotelName.toLowerCase().includes("luxury") || hotelName.toLowerCase().includes("premium")
      const isBudget = hotelName.toLowerCase().includes("budget") || hotelName.toLowerCase().includes("inn")

      let imageSet
      if (isPalace) {
        imageSet = [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945",
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
          "https://images.unsplash.com/photo-1561501900-3701fa6a0864",
          "https://images.unsplash.com/photo-1561501878-aabd62634533",
        ]
      } else if (isResort) {
        imageSet = [
          "https://images.unsplash.com/photo-1582719508461-905c673771fd",
          "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
          "https://images.unsplash.com/photo-1540541338287-41700207dee6",
          "https://images.unsplash.com/photo-1566665797739-1674de7a421a",
        ]
      } else if (isLuxury) {
        imageSet = [
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461",
          "https://images.unsplash.com/photo-1590490360182-c33d57733427",
          "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
        ]
      } else if (isBudget) {
        imageSet = [
          "https://images.unsplash.com/photo-1566195992011-5f6b21e539aa",
          "https://images.unsplash.com/photo-1541971875076-8f970d573be6",
          "https://images.unsplash.com/photo-1554009975-d74653b879f1",
          "https://images.unsplash.com/photo-1595576508898-0ad5c879a061",
        ]
      } else {
        imageSet = [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945",
          "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9",
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461",
          "https://images.unsplash.com/photo-1582719508461-905c673771fd",
          "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
        ]
      }

      const imageUrls = []
      const numImages = Math.floor(Math.random() * 2) + 3
      for (let i = 0; i < numImages; i++) {
        const baseImage = imageSet[i % imageSet.length]
        imageUrls.push(`${baseImage}?w=400&h=300&fit=crop&crop=center&q=80&sig=${Math.random()}`)
      }

      return imageUrls
    } catch (error) {
      console.error("Error getting hotel images:", error)
      return [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop&crop=center",
      ]
    }
  }

  const generatePremiumAmenities = () => {
    const premiumAmenities = [
      "Free WiFi",
      "Swimming Pool",
      "Fitness Center",
      "Spa & Wellness",
      "Restaurant",
      "Bar/Lounge",
      "Room Service",
      "Concierge",
      "Business Center",
      "Parking",
      "Airport Shuttle",
      "Laundry Service",
      "Air Conditioning",
      "Balcony/Terrace",
      "City View",
      "Garden View",
    ]
    const numAmenities = Math.floor(Math.random() * 6) + 6
    return premiumAmenities.sort(() => 0.5 - Math.random()).slice(0, numAmenities)
  }

  const handleActivityViewDetails = async (activity) => {
    try {
      let searchQuery = `${activity.activity} ${activity.location} ${tripData.destination}`
      if (
        activity.activity.toLowerCase().includes("breakfast") ||
        activity.activity.toLowerCase().includes("lunch") ||
        activity.activity.toLowerCase().includes("dinner")
      ) {
        searchQuery = `${activity.location} ${tripData.destination}`
      }

      const placeResult = await placesapi.searchPlace(searchQuery)

      if (placeResult && placeResult.location) {
        placesapi.openInGoMaps(searchQuery, placeResult.location.lat, placeResult.location.lng)
      } else {
        const query = encodeURIComponent(`${activity.activity} ${tripData.destination}`)
        const goMapsUrl = `https://go.maps.pro/search/${query}`
        window.open(goMapsUrl, "_blank", "noopener,noreferrer")
      }
    } catch (error) {
      console.error("Error finding activity location:", error)
      const query = encodeURIComponent(`${activity.activity} ${tripData.destination}`)
      const goMapsUrl = `https://go.maps.pro/search/${query}`
      window.open(goMapsUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleHotelClick = async (hotel) => {
    try {
      const searchQuery = `${hotel.name} ${tripData.destination}`
      const placeResult = await placesapi.searchPlace(searchQuery)

      if (placeResult && placeResult.location) {
        placesapi.openInGoMaps(searchQuery, placeResult.location.lat, placeResult.location.lng)
      } else {
        const query = encodeURIComponent(`${hotel.name} ${tripData.destination}`)
        const goMapsUrl = `https://go.maps.pro/search/${query}`
        window.open(goMapsUrl, "_blank", "noopener,noreferrer")
      }
    } catch (error) {
      console.error("Error finding hotel location:", error)
      const query = encodeURIComponent(`${hotel.name} ${tripData.destination}`)
      const goMapsUrl = `https://go.maps.pro/search/${query}`
      window.open(goMapsUrl, "_blank", "noopener,noreferrer")
    }
  }

  const getActivityIcon = (type) => {
    const icons = {
      sightseeing: <Camera className="w-4 h-4" />,
      food: <Utensils className="w-4 h-4" />,
      cultural: <Landmark className="w-4 h-4" />,
      shopping: <ShoppingBag className="w-4 h-4" />,
      adventure: <Navigation className="w-4 h-4" />,
      relaxation: <Sunset className="w-4 h-4" />,
      transport: <Car className="w-4 h-4" />,
      activity: <Star className="w-4 h-4" />,
    }
    return icons[type] || <Clock className="w-4 h-4" />
  }

  const getActivityColor = (type) => {
    const colors = {
      sightseeing: "bg-blue-100 text-blue-700 border-blue-200",
      food: "bg-orange-100 text-orange-700 border-orange-200",
      cultural: "bg-pink-100 text-pink-700 border-pink-200",
      shopping: "bg-yellow-100 text-yellow-700 border-yellow-200",
      adventure: "bg-red-100 text-red-700 border-red-200",
      relaxation: "bg-indigo-100 text-indigo-700 border-indigo-200",
      transport: "bg-purple-100 text-purple-700 border-purple-200",
      activity: "bg-green-100 text-green-700 border-green-200",
    }
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  const getWeatherIcon = (condition) => {
    if (!condition) return <Sun className="w-6 h-6" />

    const conditionLower = condition.toLowerCase()
    if (conditionLower.includes("rain") || conditionLower.includes("drizzle")) {
      return <CloudRain className="w-6 h-6" />
    } else if (conditionLower.includes("cloud")) {
      return <Cloud className="w-6 h-6" />
    } else if (conditionLower.includes("sun") || conditionLower.includes("clear")) {
      return <Sun className="w-6 h-6" />
    } else {
      return <Cloud className="w-6 h-6" />
    }
  }

  const WeatherCard = () => {
    if (!weatherData) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl border shadow-xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-8 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              {getWeatherIcon(weatherData.condition)}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Weather for Your Trip</h3>
              <p className="text-gray-600">{weatherData.location}</p>
              {weatherData.date && (
                <p className="text-sm text-gray-500">Starting {new Date(weatherData.date).toDateString()}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-sky-600">{Math.round(weatherData.temperature)}°C</div>
            <div className="text-gray-600 capitalize">{weatherData.condition}</div>
          </div>
        </div>

        {weatherData.icon && (
          <div className="flex justify-center mb-6">
            <img src={weatherData.icon || "/placeholder.svg"} alt={weatherData.condition} className="w-20 h-20" />
          </div>
        )}
      </motion.div>
    )
  }

  if (generating) {
    return (
      <div className="min-h-[700px] flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg mx-auto p-8"
        >
          <div className="mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-24 h-24 mx-auto mb-6"
            >
              <div className="relative">
                <Sparkles className="w-24 h-24 text-purple-600" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="absolute inset-0 w-24 h-24 bg-purple-200 rounded-full opacity-20"
                />
              </div>
            </motion.div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              AI is Crafting Your Perfect Journey
            </h2>
            <p className="text-gray-700 mb-6 text-lg">{currentStep}</p>
          </div>

          <div className="space-y-6">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
              <motion.div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full transition-all duration-1000 shadow-lg"
                style={{ width: `${progress}%` }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              />
            </div>
            <p className="text-lg font-semibold text-gray-600">{Math.round(progress)}% Complete</p>
            <p className="text-sm text-gray-500">Creating personalized experiences just for you...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={generateCompleteTripPlan}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Your AI-Crafted Journey Awaits! ✨
        </h2>
        <p className="text-gray-600 text-xl">Personalized itinerary powered by artificial intelligence</p>
        <div className="mt-4 inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md">
          <Globe className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-gray-700">Powered by go.maps.pro</span>
        </div>
      </motion.div>

      {/* Trip Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="rounded-3xl border shadow-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
          <div className="grid md:grid-cols-4 gap-8 text-center mb-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Destination</h3>
              <p className="text-gray-600 font-semibold text-lg">{tripData.destination}</p>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Duration</h3>
              <p className="text-gray-600 font-semibold text-lg">{tripData.days} Days</p>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Budget</h3>
              <p className="text-gray-600 font-semibold text-lg">₹{tripData.budget.toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <Plane className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Travelers</h3>
              <p className="text-gray-600 font-semibold text-lg">
                {tripData.travelers || 1} Person{(tripData.travelers || 1) > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* User Preferences Section */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Special Interest - NEW SECTION */}
            {!shouldIgnoreSpecialInterest() && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-amber-200 md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">Your Special Interest</h4>
                </div>
                <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-xl text-lg font-medium border border-amber-200">
                  {tripData.specialInterest}
                </div>
                <p className="mt-3 text-gray-600">Your trip has been specially crafted to focus on this interest</p>
              </div>
            )}

            {/* Interests */}
            {tripData.interests && tripData.interests.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-green-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">Your Interests</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tripData.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Food Preferences */}
            {tripData.foodPreferences && tripData.foodPreferences.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">Food Preferences</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tripData.foodPreferences.map((pref, idx) => (
                    <span
                      key={idx}
                      className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-200"
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Weather Card */}
      <WeatherCard />

      {/* AI Summary */}
      {tripPlan?.summary && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="rounded-3xl border shadow-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">AI Trip Insights</h3>
            </div>
            <p className="text-gray-700 leading-relaxed text-xl font-medium">{tripPlan.summary}</p>
          </div>
        </motion.div>
      )}

      {/* Personalization Summary */}
      {tripPlan?.personalizationSummary && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="rounded-3xl border shadow-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Personalized Just For You</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Special Interest Match - NEW SECTION */}
              {tripPlan.personalizationSummary.specialInterestMatched && (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 md:col-span-3">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>Special Interest Focus</span>
                  </h4>
                  <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-xl text-sm border border-amber-200">
                    {tripPlan.personalizationSummary.specialInterestMatched}
                  </div>
                </div>
              )}

              {tripPlan.personalizationSummary.interestsMatched?.length > 0 && (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <Star className="w-4 h-4 text-green-600" />
                    <span>Interests Included</span>
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {tripPlan.personalizationSummary.interestsMatched.map((interest, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                        <span>{interest}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tripPlan.personalizationSummary.foodPrefsMatched?.length > 0 && (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <Utensils className="w-4 h-4 text-orange-600" />
                    <span>Food Preferences</span>
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {tripPlan.personalizationSummary.foodPrefsMatched.map((pref, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                        <span>{pref}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tripPlan.personalizationSummary.alternativesProvided?.length > 0 && (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span>Alternatives Provided</span>
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {tripPlan.personalizationSummary.alternativesProvided.map((alt, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        <span>{alt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Day-wise Itinerary */}
      {tripPlan && tripPlan.days && tripPlan.days.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-bold text-gray-800">AI-Generated Itinerary</h3>
              <div className="text-lg text-gray-600 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full border border-green-200">
                Total: ₹{tripPlan.totalEstimatedCost?.toLocaleString() || "Calculating..."}
              </div>
            </div>

            {/* Day Selector */}
            <div className="flex space-x-3 overflow-x-auto pb-3">
              {tripPlan.days.map((day) => (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(day.day)}
                  className={`flex-shrink-0 px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
                    selectedDay === day.day
                      ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-xl"
                      : "bg-white text-gray-600 hover:bg-gray-50 shadow-md border"
                  }`}
                >
                  Day {day.day}
                </button>
              ))}
            </div>

            {/* Selected Day Details */}
            {tripPlan.days.map(
              (day) =>
                selectedDay === day.day && (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-3xl shadow-2xl border overflow-hidden"
                  >
                    {/* Day Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-8">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-3xl font-bold mb-3">{day.title}</h4>
                          <p className="text-blue-100 mb-4 text-lg">{day.theme}</p>
                          {day.weatherConsiderations && (
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-4 inline-block">
                              🌤️ {day.weatherConsiderations}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-3">
                            {day.highlights?.map((highlight, idx) => (
                              <span
                                key={idx}
                                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">₹{day.totalCost?.toLocaleString() || "0"}</div>
                          <div className="text-blue-100 text-lg">Daily Budget</div>
                        </div>
                      </div>
                    </div>

                    {/* Activities Timeline */}
                    <div className="p-8">
                      <div className="space-y-6">
                        {day.activities?.map((activity, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`flex items-start space-x-6 p-6 rounded-2xl transition-all duration-300 border ${
                              activity.matchesSpecialInterest
                                ? "bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border-amber-200"
                                : activity.weatherSuitable === false
                                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-yellow-200"
                                  : "bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 hover:border-purple-200"
                            }`}
                          >
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-purple-100">
                                <Clock className="w-6 h-6 text-purple-600" />
                              </div>
                            </div>

                            <div className="flex-grow">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-4">
                                  <span className="font-bold text-purple-700 text-lg">{activity.time}</span>
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm border font-medium ${getActivityColor(activity.type)}`}
                                  >
                                    {getActivityIcon(activity.type)}
                                    <span className="ml-2 capitalize">{activity.type}</span>
                                  </span>
                                  {activity.weatherSuitable === false && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                      ⚠️ Weather Alert
                                    </span>
                                  )}
                                  {/* Special Interest Badge - NEW */}
                                  {activity.matchesSpecialInterest && (
                                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium flex items-center">
                                      <Lightbulb className="w-3 h-3 mr-1" />
                                      Special Interest
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600 text-lg">₹{activity.cost || 0}</div>
                                  <div className="text-sm text-gray-500">{activity.duration}</div>
                                </div>
                              </div>

                              <h5 className="font-bold text-gray-800 mb-2 text-lg">
                                {activity.activity}
                                {activity.location && (
                                  <span className="text-gray-500 text-sm ml-2 font-normal">at {activity.location}</span>
                                )}
                              </h5>

                              {/* Add preference matching indicators */}
                              {(activity.matchesInterests?.length > 0 || activity.matchesFoodPrefs?.length > 0) && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {activity.matchesInterests?.map((interest, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium border border-green-200 flex items-center space-x-1"
                                    >
                                      <Star className="w-3 h-3" />
                                      <span>Matches: {interest}</span>
                                    </span>
                                  ))}
                                  {activity.matchesFoodPrefs?.map((foodPref, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-orange-50 text-orange-700 px-2 py-1 rounded-full text-xs font-medium border border-orange-200 flex items-center space-x-1"
                                    >
                                      <Utensils className="w-3 h-3" />
                                      <span>Matches: {foodPref}</span>
                                    </span>
                                  ))}
                                </div>
                              )}

                              <p className="text-gray-600 mb-3 leading-relaxed">{activity.description}</p>

                              {activity.tips && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                  <p className="text-yellow-800 text-sm font-medium">💡 Tip: {activity.tips}</p>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-gray-500">
                                  <motion.div
                                    whileHover={{ scale: 1.1, color: "#3B82F6" }}
                                    onHoverStart={() => setHoveredActivity(`${day.day}-${idx}`)}
                                    onHoverEnd={() => setHoveredActivity(null)}
                                    className="cursor-pointer"
                                  >
                                    <MapPin
                                      className={`w-5 h-5 mr-2 transition-colors ${
                                        hoveredActivity === `${day.day}-${idx}` ? "text-blue-600" : "text-gray-500"
                                      }`}
                                    />
                                  </motion.div>
                                  <span className="font-medium">{activity.location}</span>
                                </div>
                                <button
                                  onClick={() => handleActivityViewDetails(activity)}
                                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all"
                                >
                                  <span>View on Map</span>
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Personalized Note */}
                    {day.personalizedNote && (
                      <div className="p-8 bg-gray-50 border-t">
                        <h5 className="text-lg font-bold text-gray-800 mb-2">Personalized Note</h5>
                        <p className="text-gray-700 leading-relaxed">{day.personalizedNote}</p>
                      </div>
                    )}
                  </motion.div>
                ),
            )}
          </div>
        </motion.div>
      )}

      {/* Insights and Tips */}
      {tripPlan?.insights && tripPlan?.culturalTips && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Insights */}
            <div className="rounded-3xl border shadow-xl bg-gradient-to-r from-teal-50 via-emerald-50 to-green-50 p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Travel Insights</h3>
              </div>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed">
                {tripPlan.insights.map((insight, idx) => (
                  <li key={idx} className="mb-2">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cultural Tips */}
            <div className="rounded-3xl border shadow-xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Cultural Tips</h3>
              </div>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed">
                {tripPlan.culturalTips.map((tip, idx) => (
                  <li key={idx} className="mb-2">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Budget Breakdown */}
      {tripPlan?.budgetBreakdown && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="rounded-3xl border shadow-xl bg-gradient-to-r from-pink-50 via-red-50 to-orange-50 p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Budget Breakdown</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(tripPlan.budgetBreakdown).map(([category, amount]) => (
                <div
                  key={category}
                  className="bg-white rounded-2xl p-4 shadow-md border border-orange-100 hover:shadow-lg transition-all"
                >
                  <h4 className="text-lg font-semibold text-gray-700 capitalize">{category}</h4>
                  <p className="text-xl font-bold text-orange-600">₹{amount?.toLocaleString() || "0"}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Hotels Section */}
      {dayWiseHotels && Object.keys(dayWiseHotels).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-gray-800">Recommended Hotels</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {dayWiseHotels[selectedDay]?.map((hotel, idx) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-3xl shadow-2xl border overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="relative">
                    <img
                      src={hotel.thumbnail || "/placeholder.svg"}
                      alt={hotel.name}
                      className="w-full h-56 object-cover"
                    />
                    {hotel.isTopRated && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">
                        Top Rated
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">{hotel.name}</h4>
                    <div className="flex items-center space-x-2 mb-3">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-600 font-medium">{hotel.rating}</span>
                      <span className="text-gray-500">({Math.floor(Math.random() * 500) + 100} reviews)</span>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{hotel.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-green-600 font-bold">
                          ₹{hotel.estimatedPrice?.toLocaleString() || "Calculating..."}
                        </div>
                        <div className="text-sm text-gray-500">per night</div>
                      </div>
                      <div className="text-right">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                          {hotel.hotelType}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 text-sm">{hotel.address}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities?.slice(0, 5).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium border border-blue-200"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleHotelClick(hotel)}
                      className="mt-4 w-full text-blue-600 hover:text-blue-800 font-semibold flex items-center justify-center space-x-1 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all border border-blue-200"
                    >
                      <span>View on Map</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <div className="flex justify-between">
          <button
            onClick={onPrev}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Finalise Trip Plan →
          </button>
        </div>
      </motion.div>
    </div>
  )
}
