import axios from "axios";
import { OPENCAGE_API_KEY } from "../config/main.config";
import AppError from "./app-error.helper";

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
  if (!OPENCAGE_API_KEY) {
    throw AppError("OpenCage API key is not configured", 500);
  }

  const response = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
    params: {
      q: address,
      key: OPENCAGE_API_KEY,
      language: "id",
      countrycode: "id",
      limit: 1,
      no_annotations: 1,
    },
  });

  const { results, status } = response.data;

  if (status.code !== 200) {
    throw AppError(`Geocoding failed: ${status.message}`, 502);
  }

  if (!results || results.length === 0) {
    throw AppError("Location not found. Please check the address and try again.", 422);
  }

  const { lat, lng } = results[0].geometry;
  const formattedAddress = results[0].formatted;

  return {
    latitude: lat,
    longitude: lng,
    formattedAddress,
  };
};
