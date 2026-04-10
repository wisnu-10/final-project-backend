export interface CreateLaundryItemDTO {
  name: string;
  pricingType: "kiloan" | "per_item";
  price: number;
}

export interface UpdateLaundryItemDTO {
  name?: string;
  pricingType?: "kiloan" | "per_item";
  price?: number;
}

export interface GetLaundryItemsQuery {
  search?: string;
  pricingType?: string;
  page?: number;
  limit?: number;
}
