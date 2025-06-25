import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plane, Train, Bus, Car, Clock, ExternalLink, Star, Zap, Loader2 } from "lucide-react"
import aiService from "../Services/deepseekapi" // Your AI service

export default function TransportSelection({ tripData, updateTripData, onNext, onPrev }) {
  const [transportOptions, setTransportOptions] = useState({ flights: [], trains: [], buses: [], cars: [] })
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [error, setError] = useState("")

  const from = tripData?.startLocation || "New York"
  const to = tripData?.destination || "London"
  const budget = tripData?.budget || "2000"
  const startDate = tripData?.startDate || new Date().toISOString().split("T")[0]

  useEffect(() => {
    fetchTransportOptions()
    // eslint-disable-next-line
  }, [from, to, budget])

  const fetchTransportOptions = async () => {
    setLoading(true)
    setError("")

    try {
      // AI prompt: ask for real, up-to-date, and realistic options for the given route and budget
      const prompt = `
You are a travel assistant. For a trip from "${from}" to "${to}" with a budget of "${budget}" (use the correct local currency for the route), generate 3-4 realistic options each for flights, buses, and car rentals. 
For TRAINS, return 3-4 realistic trains, and for each train, include a "classes" array with all available classes (e.g., Sleeper (SL), 3rd AC (3A), 2nd AC (2A), 1st AC (1A)), and for each class, provide the class name and price (in correct currency). 
For each option, provide:
- name (flight/train/bus/car name or code)
- company/operator/airline
- price (for flights, buses, cars: in correct currency)
- duration
- departure time
- arrival time
- features (array)
- booking_url (real or best-guess booking link for that option)
- For trains: classes (array of {class, price})

Return ONLY a JSON object with this structure:
{
  "flights": [ { ... } ],
  "trains": [ { ... } ],
  "buses": [ { ... } ],
  "cars": [ { ... } ]
}
Do not include any extra text or explanation. All data must be realistic and up-to-date for the given route and date.
      `
      const aiResponse = await aiService.getResponse(prompt)

      // Parse JSON from AI response
      let parsedOptions
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse
        parsedOptions = JSON.parse(jsonStr)
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError)
        parsedOptions = { flights: [], trains: [], buses: [], cars: [] }
      }

      // Add IDs and type for React rendering
      const addMeta = (arr, type) =>
        (arr || []).map((option) => ({
          ...option,
          id: `${type}-${Math.random().toString(36).substring(2, 9)}`,
          type,
        }))

      setTransportOptions({
        flights: addMeta(parsedOptions.flights, "flight"),
        trains: addMeta(parsedOptions.trains, "train"),
        buses: addMeta(parsedOptions.buses, "bus"),
        cars: addMeta(parsedOptions.cars, "car"),
      })

      // Auto-select cheapest option (for flights, buses, cars: use price; for trains: use lowest class price)
      const allOptions = [
        ...addMeta(parsedOptions.flights, "flight"),
        ...addMeta(parsedOptions.trains, "train"),
        ...addMeta(parsedOptions.buses, "bus"),
        ...addMeta(parsedOptions.cars, "car"),
      ]
      if (allOptions.length > 0) {
        // For trains, use the lowest class price for comparison
        const getOptionPrice = (opt) =>
          opt.type === "train" && Array.isArray(opt.classes) && opt.classes.length > 0
            ? Math.min(...opt.classes.map((c) => c.price))
            : opt.price
        const cheapest = allOptions.sort((a, b) => getOptionPrice(a) - getOptionPrice(b))[0]
        setSelectedOption(cheapest)
        updateTripData?.({ selectedTransport: cheapest })
      }
    } catch (error) {
      console.error("Error fetching transport options:", error)
      setError("Failed to fetch transport options. Please try again.")
    }

    setLoading(false)
  }

  // Card color helpers
  const getColorForType = (type) => {
    switch (type) {
      case "flight":
        return "from-blue-500 to-indigo-600"
      case "train":
        return "from-green-500 to-emerald-600"
      case "bus":
        return "from-orange-500 to-red-600"
      case "car":
        return "from-purple-500 to-pink-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }
  const getBgColorForType = (type) => {
    switch (type) {
      case "flight":
        return "from-blue-50 to-indigo-50"
      case "train":
        return "from-green-50 to-emerald-50"
      case "bus":
        return "from-orange-50 to-red-50"
      case "car":
        return "from-purple-50 to-pink-50"
      default:
        return "from-gray-50 to-gray-100"
    }
  }

  // Card component for flights, buses, cars
  const TransportCard = ({ option, isSelected }) => {
    const getIcon = () => {
      switch (option.type) {
        case "flight":
          return Plane
        case "train":
          return Train
        case "bus":
          return Bus
        case "car":
          return Car
        default:
          return Bus
      }
    }
    const Icon = getIcon()
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${
          isSelected ? "ring-4 ring-yellow-400" : ""
        }`}
        onClick={() => {
          setSelectedOption(option)
          updateTripData?.({ selectedTransport: option })
        }}
      >
        {isSelected && (
          <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Selected
          </div>
        )}
        <div className={`bg-gradient-to-br ${getBgColorForType(option.type)} rounded-xl p-4 shadow-lg border border-white/50 h-full`}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${getColorForType(option.type)} rounded-lg flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">{option.name}</h3>
                <p className="text-xs text-gray-600">{option.company || option.operator || option.airline}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-800">
                {option.price}
              </div>
              <div className="text-xs text-gray-600">per person</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-600" />
              <span className="text-gray-700">{option.duration}</span>
            </div>
            <span className="text-gray-600">
              {option.departure} - {option.arrival}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mb-4">
            {(option.features || []).slice(0, 2).map((feature, idx) => (
              <span key={idx} className="text-xs bg-white/60 px-2 py-1 rounded-full text-gray-700">
                {feature}
              </span>
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (option.booking_url) window.open(option.booking_url, "_blank")
            }}
            className={`w-full bg-gradient-to-r ${getColorForType(option.type)} text-white font-bold py-2 px-3 rounded-lg text-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-1`}
          >
            <span>Book Now</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    )
  }

  // Loading, error, and empty states
  const totalOptions =
    transportOptions.flights.length +
    transportOptions.trains.length +
    transportOptions.buses.length +
    transportOptions.cars.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
          <p className="mt-6 text-xl text-gray-600">🤖 AI is analyzing transport options...</p>
          <p className="text-sm text-gray-500 mt-2">
            Searching {from} to {to}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTransportOptions}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (totalOptions === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">💸</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Options Found</h2>
          <p className="text-gray-600 mb-4">
            No transport options available for {from} to {to} within your budget.
          </p>
          {onPrev && (
            <button onClick={onPrev} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              ← Adjust Budget
            </button>
          )}
        </div>
      </div>
    )
  }

  // Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            🚀 Smart Transport Selection
          </h1>
          <p className="text-xl text-gray-600">
            {from} → {to} • Budget: {budget}
          </p>
        </motion.div>

        {/* AI Analysis */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-2xl"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">AI Transport Analysis</h3>
          </div>
          <p className="text-emerald-100 leading-relaxed mb-2">
            ✅ Found {totalOptions} transport options within your budget!
          </p>
          <p className="text-emerald-100 text-sm">
            {transportOptions.cars.length > 0 && `${transportOptions.cars.length} car rentals, `}
            {transportOptions.buses.length > 0 && `${transportOptions.buses.length} buses, `}
            {transportOptions.trains.length > 0 && `${transportOptions.trains.length} trains, `}
            {transportOptions.flights.length > 0 && `${transportOptions.flights.length} flights `}
            available for your journey.
          </p>
        </motion.div>

        {/* Cars, Buses, Flights */}
        {["cars", "buses", "flights"].map((type) =>
          transportOptions[type].length > 0 ? (
            <div key={type}>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                {type === "cars" && <Car className="w-6 h-6 mr-2 text-purple-600" />}
                {type === "buses" && <Bus className="w-6 h-6 mr-2 text-orange-600" />}
                {type === "flights" && <Plane className="w-6 h-6 mr-2 text-blue-600" />}
                {`Available ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {transportOptions[type].map((option) => (
                  <TransportCard key={option.id} option={option} isSelected={selectedOption?.id === option.id} />
                ))}
              </div>
            </div>
          ) : null
        )}

        {/* Trains */}
        {transportOptions.trains.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Train className="w-6 h-6 mr-2 text-green-600" />
              Available Trains
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transportOptions.trains.map((train) => (
              <motion.div
  key={train.id}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className={`relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${
    selectedOption?.id === train.id ? "ring-4 ring-orange-400" : ""
  }`}
  onClick={() => {
    setSelectedOption(train);
    updateTripData?.({ selectedTransport: train });
  }}
>
  {selectedOption?.id === train.id && (
    <div className="absolute -top-3 -right-3 z-10 bg-gradient-to-r from-orange-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-md">
      <Star className="w-4 h-4 mr-1 fill-current" />
      Selected
    </div>
  )}
  <div className="bg-gradient-to-br from-green-50/90 to-teal-50/90 rounded-3xl p-5 shadow-xl border border-green-100/50 backdrop-blur-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-bold text-gray-900 text-base">{train.name}</h3>
        <p className="text-sm text-gray-500">{train.trainNo} {train.company || train.operator}</p>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-500 flex items-center justify-end">
          <Clock className="w-4 h-4 mr-1" /> {train.duration}
        </div>
        <div className="text-sm text-gray-500">{train.departure} - {train.arrival}</div>
      </div>
    </div>
    {/* Classes Table */}
    <div className="mb-4">
      <table className="w-full text-sm border border-gray-200/30 rounded-2xl bg-white/40 backdrop-blur-md">
        <thead>
          <tr className="bg-gray-100/50">
            <th className="text-left p-3 font-semibold text-gray-700 rounded-tl-2xl">Class</th>
            <th className="text-right p-3 font-semibold text-gray-700 rounded-tr-2xl">Price</th>
          </tr>
        </thead>
        <tbody>
          {(train.classes || []).map((cls, idx) => (
            <tr key={idx} className="border-t border-gray-200/30 hover:bg-gray-50/50 transition-colors duration-200">
              <td className="p-3 text-gray-800">{cls.class}</td>
              <td className="p-3 text-right text-gray-800">{cls.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* Features */}
    <div className="flex flex-wrap gap-2 mb-5">
      {(train.features || []).slice(0, 2).map((feature, idx) => (
        <span key={idx} className="text-xs bg-white/60 px-3 py-1 rounded-full text-gray-600 flex items-center">
          <Star className="w-3 h-3 mr-1 text-green-500" /> {feature}
        </span>
      ))}
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (train.booking_url) window.open(train.booking_url, "_blank");
      }}
      className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white font-semibold py-3 px-4 rounded-2xl text-base hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
    >
      <span>Book Now</span>
      <ExternalLink className="w-4 h-4" />
    </button>
  </div>
</motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Summary */}
        {selectedOption && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div
                className={`w-12 h-12 bg-gradient-to-r ${getColorForType(selectedOption.type)} rounded-xl flex items-center justify-center`}
              >
                {selectedOption.type === "flight" && <Plane className="w-6 h-6 text-white" />}
                {selectedOption.type === "train" && <Train className="w-6 h-6 text-white" />}
                {selectedOption.type === "bus" && <Bus className="w-6 h-6 text-white" />}
                {selectedOption.type === "car" && <Car className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Selected: {selectedOption.name}</h3>
                <p className="text-gray-600">Ready to proceed with trip planning</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-800">
                  {selectedOption.type === "train" && Array.isArray(selectedOption.classes) && selectedOption.classes.length > 0
                    ? `from ${Math.min(...selectedOption.classes.map((c) => c.price))}`
                    : selectedOption.price}
                </div>
                <div className="text-sm text-gray-600">Cost</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">{selectedOption.duration}</div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">⭐ AI Pick</div>
                <div className="text-sm text-gray-600">Recommended</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        {(onNext || onPrev) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-between items-center pt-8"
          >
            {onPrev && (
              <button
                onClick={onPrev}
                className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-400"
              >
                <span>← Back to Details</span>
              </button>
            )}

            {onNext && (
              <button
                onClick={onNext}
                disabled={!selectedOption}
                className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all duration-200 ${
                  selectedOption
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <span>Generate Trip Plan</span>
                <span>→</span>
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}