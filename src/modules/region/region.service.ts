import axios from "axios";
import AppError from "../../helpers/app-error.helper";

const EMSIFA_BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/api";

export const regionService = {
  async getProvinces() {
    const response = await axios.get(`${EMSIFA_BASE_URL}/provinces.json`);
    return response.data as { id: string; name: string }[];
  },

  async getCitiesByProvince(provinceId: string) {
    const response = await axios
      .get(`${EMSIFA_BASE_URL}/regencies/${provinceId}.json`)
      .catch(() => {
        throw AppError(`Province with ID "${provinceId}" not found`, 404);
      });

    return response.data as { id: string; province_id: string; name: string }[];
  },

  async getDistrictsByCity(cityId: string) {
    const response = await axios
      .get(`${EMSIFA_BASE_URL}/districts/${cityId}.json`)
      .catch(() => {
        throw AppError(`City with ID "${cityId}" not found`, 404);
      });

    return response.data as { id: string; regency_id: string; name: string }[];
  },
};
