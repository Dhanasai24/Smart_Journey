import axios from "axios"

class TrainService {
  constructor() {
    this.apiKey = "0b988fe988msh90169212065c95cp1aae42jsn28f54da6f1cb"
    this.apiHost = "irctc1.p.rapidapi.com"
  }

  // Always use station codes provided as arguments (from DeepSeek in App.jsx)
  async searchTrains(startCode, endCode, date) {
    try {
      if (!startCode || !endCode) {
        throw new Error("Station codes not found")
      }

      const url = `https://${this.apiHost}/api/v3/trainBetweenStations?fromStationCode=${startCode}&toStationCode=${endCode}&dateOfJourney=${date}`
      const response = await axios.get(url, {
        headers: {
          "X-RapidAPI-Key": this.apiKey,
          "X-RapidAPI-Host": this.apiHost,
        },
      })

      return response.data.data || []
    } catch (error) {
      console.error("Train API Error:", error)
      // Return mock data for demo purposes
      return [
        {
          train_number: "12345",
          train_name: "Rajdhani Express",
          departure_time: "06:00",
          arrival_time: "14:30",
          duration: "8h 30m",
        },
        {
          train_number: "12346",
          train_name: "Shatabdi Express",
          departure_time: "15:00",
          arrival_time: "22:45",
          duration: "7h 45m",
        },
      ]
    }
  }
}

export default new TrainService()