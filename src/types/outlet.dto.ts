// Data yang dikirim frontend saat CREATE outlet
// latitude & longitude TIDAK perlu dikirim — akan di-geocode otomatis oleh OpenCage
export interface CreateOutletDTO {
  name: string;
  address: string;
  districtId: number;
  districtName: string;
  cityId: number;
  cityName: string;
  provinceId: number;
  provinceName: string;
  postalCode: string;
  maxServiceDistance: number;
  isActive: boolean;
}

// Data yang dikirim frontend saat UPDATE outlet
// Jika address/wilayah berubah, koordinat akan di-geocode ulang otomatis
export interface UpdateOutletDTO {
  name?: string;
  address?: string;
  districtId?: number;
  districtName?: string;
  cityId?: number;
  cityName?: string;
  provinceId?: number;
  provinceName?: string;
  postalCode?: string;
  maxServiceDistance?: number;
  isActive?: boolean;
}

export interface GetOutletsQuery {
  search?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}
