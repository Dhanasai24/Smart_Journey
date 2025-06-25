import axios from "axios";

class PlacesService {
  constructor() {
    this.apiKey = "AlzaSyYrIOTA7QnzWku4p8lzOfg3rDBloalTiUx"; // For dev only
    this.baseUrl = "https://maps.gomaps.pro/maps/api/geocode/json";
  }

  async searchPlace(query) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          address: query,
          key: this.apiKey,
        },
      });

      if (response.data.status === "OK" && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          name: result.formatted_address,
          location: result.geometry.location, // { lat, lng }
        };
      }

      return null;
    } catch (error) {
      console.error("Places API Error:", error.response?.data || error.message);
      return null;
    }
  }
openInGoMaps(address, lat, lng) {
  const query = address ? encodeURIComponent(address) : `${lat},${lng}`;
  const url = `https://maps.gomaps.pro/maps?q=${query}`;
  window.open(url, "_blank");
}
}

export default new PlacesService();
