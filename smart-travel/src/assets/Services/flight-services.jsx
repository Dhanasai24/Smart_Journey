import axios from "axios";

class FlightService {
  constructor() {
    this.apiKey = "7448f0181bb8880fc33c16830b50c195";
    this.baseUrl = "https://api.aviationstack.com/v1/flights";
  }
async searchFlights(depCode, arrCode, date) {
  try {
    const response = await axios.get(this.baseUrl, {
      params: {
        access_key: this.apiKey,
        dep_iata: depCode.toUpperCase(),
        arr_iata: arrCode.toUpperCase(),
        flight_date: date, // Pass the date here (YYYY-MM-DD)
        limit: 10,
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error("Flight API Error:", error);
    return [];
  }
}
}

export default new FlightService();
