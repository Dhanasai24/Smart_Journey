import axios from "axios"

class WeatherService {
  constructor() {
    this.apiKey = import.meta.env.VITE_WEATHER_API_KEY // OpenWeatherMap API key
    this.baseUrl = "https://api.openweathermap.org/data/2.5/weather"
  }

  async getWeather(city) {
    try {
      console.log("🌤️ Fetching weather for:", city)

      const response = await axios.get(this.baseUrl, {
        params: {
          q: city,
          appid: this.apiKey,
          units: "metric",
        },
        timeout: 8000,
      })

      console.log("✅ Weather API response received for:", response.data.name)

      return {
        location: response.data.name,
        temperature: Math.round(response.data.main.temp),
        condition: response.data.weather[0].description,
        icon: response.data.weather[0].icon
          ? `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`
          : null,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind?.speed || 0,
        apiSuccess: true,
      }
    } catch (error) {
      console.log("⚠️ Weather API unavailable for:", city, "- Using dynamic fallback")

      // Pure dynamic fallback - no predefined data
      return {
        location: city,
        temperature: Math.floor(Math.random() * 20) + 15, // Random 15-35°C
        condition: "partly cloudy",
        icon: null,
        humidity: Math.floor(Math.random() * 40) + 40, // Random 40-80%
        windSpeed: Math.floor(Math.random() * 10) + 2, // Random 2-12 km/h
        apiSuccess: false,
        fallback: true,
      }
    }
  }
}

export default new WeatherService()
