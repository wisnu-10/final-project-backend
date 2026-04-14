import { prisma } from "../../../config/prisma-client.config";
import AppError from "../../../helpers/app-error.helper";
import {
  CreateLaundryItemDTO,
  UpdateLaundryItemDTO,
  GetLaundryItemsQuery,
} from "../../../types/laundry-item.dto";

export const laundryItemService = {
  async createLaundryItem(data: CreateLaundryItemDTO) {
    const existingItem = await prisma.laundryItem.findFirst({
      where: { name: data.name, deletedAt: null },
    });

    if (existingItem) {
      throw AppError("Laundry item with this name already exists", 409);
    }

    const item = await prisma.laundryItem.create({
      data: {
        name: data.name,
        pricingType: data.pricingType,
        price: data.pricingType === "kiloan" ? 0 : data.price,
      },
    });

    return item;
  },

  async getLaundryItems(query: GetLaundryItemsQuery) {
    const { search, pricingType, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (pricingType) {
      where.pricingType = pricingType;
    }

    const [items, total] = await Promise.all([
      prisma.laundryItem.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.laundryItem.count({ where }),
    ]);

    return {
      laundryItems: items.map((item) => ({
        id: item.id,
        name: item.name,
        pricingType: item.pricingType,
        price: item.price,
        createdAt: item.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getLaundryItemById(id: string) {
    const item = await prisma.laundryItem.findUnique({
      where: { id, deletedAt: null },
    });

    if (!item) throw AppError("Laundry item not found", 404);

    return {
      id: item.id,
      name: item.name,
      pricingType: item.pricingType,
      price: item.price,
      createdAt: item.createdAt,
    };
  },

  async updateLaundryItem(id: string, data: UpdateLaundryItemDTO) {
    const item = await prisma.laundryItem.findUnique({
      where: { id, deletedAt: null },
    });

    if (!item) throw AppError("Laundry item not found", 404);

    if (data.name && data.name !== item.name) {
      const duplicate = await prisma.laundryItem.findFirst({
        where: { name: data.name, deletedAt: null, NOT: { id } },
      });
      if (duplicate) {
        throw AppError("Laundry item with this name already exists", 409);
      }
    }

    const updatePayload: any = { ...data };

    // If pricing type is changed to kiloan, reset price to 0
    if (data.pricingType === "kiloan") {
      updatePayload.price = 0;
    }

    const updatedItem = await prisma.laundryItem.update({
      where: { id },
      data: updatePayload,
    });

    return {
      id: updatedItem.id,
      name: updatedItem.name,
      pricingType: updatedItem.pricingType,
      price: updatedItem.price,
      createdAt: updatedItem.createdAt,
    };
  },

  async deleteLaundryItem(id: string) {
    const item = await prisma.laundryItem.findUnique({
      where: { id, deletedAt: null },
    });

    if (!item) throw AppError("Laundry item not found", 404);

    // Check if there are order items referencing this laundry item
    const activeOrderItems = await prisma.orderItem.count({
      where: { laundryItemId: id, deletedAt: null },
    });

    if (activeOrderItems > 0) {
      throw AppError(
        `Cannot delete: ${activeOrderItems} order(s) are still using this laundry item`,
        400,
      );
    }

    await prisma.laundryItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: "Laundry item deleted successfully" };
  },
};
