import axios from "axios";
import { AddressCustomerDTO } from "../../types/addressCustomer.dto";
import { OPENCAGE_API_KEY } from "../../config/main.config";
import AppError from "../../helpers/app-error.helper";
import { prisma } from "../../config/prisma-client.config";

export const addressCustomerService = {
  async createAddress(
    customerId: string,
    {
      recipientName,
      recipientPhoneNumber,
      label,
      address,
      districtId,
      districtName,
      cityId,
      cityName,
      provinceName,
      provinceId,
      postalCode,
      notes,
      isPrimary,
    }: AddressCustomerDTO,
  ) {

    /* ======================= PROVONSI  ======================= */
    const provRes = await axios.get(
      `https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json`,
    );

    // buat ngecek apakah id di FE sama dengan id di BE
    const province = provRes.data.find((p: any) => Number(p.id) === provinceId);

    if (!province) {
      throw AppError("Invalid province", 400);
    }

    /* ======================= CITY ======================= */

    const cityRes = await axios.get(
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`,
    );

    const city = cityRes.data.find((c: any) => Number(c.id) === cityId);

    if (!city) {
      throw AppError("Invalid city", 400);
    }

    /* ======================= DISTRICT ======================= */

    const districtRes = await axios.get(
      `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`,
    );

    const district = districtRes.data.find(
      (d: any) => Number(d.id) === districtId,
    );

    if (!district) {
      throw AppError("Invalid district", 400);
    }

    

    /* ======================= OPENCAGE ======================= */
    const fullAddress = `${address}, ${district.name}, ${city.name}, ${province.name}, indonesia`;

    const geoRes = await axios.get(
      "https://api.opencagedata.com/geocode/v1/json",
      {
        params: {
          q: fullAddress,
          key: OPENCAGE_API_KEY,
          countrycode: "id",
          limit: 1,
        },
      },
    );

    const result = geoRes.data.results[0];

    if (!result) {
      throw AppError("Location not found", 400);
    }

    const latitudeGeo = result.geometry.lat;
    const longitudeGeo = result.geometry.lng;

    await prisma.$transaction(async (tx) => {
      if (isPrimary === true) {
        // reset semua primary
        await tx.customerAddress.updateMany({
          where: { customerId },
          data: { isPrimary: false },
        });
      }

      const addressCount = await tx.customerAddress.count({
        where: { customerId },
      });

      await tx.customerAddress.create({
        data: {
          customerId,
          recipientName,
          recipientPhoneNumber,
          label,
          address,
          districtId,
          districtName: district.name,
          cityId,
          cityName: city.name,
          provinceId,
          provinceName: province.name,
          postalCode,
          notes,
          isPrimary: isPrimary || addressCount === 0, // addressCount === 0 => 0 = 0 = true
          latitude: latitudeGeo,
          longitude: longitudeGeo,
        },
      });
    });
  },

  async updateAddress(
    customerId: string,
    addressId: string,
    {
      recipientName,
      recipientPhoneNumber,
      label,
      address,
      districtId,
      districtName,
      cityId,
      cityName,
      provinceName,
      provinceId,
      postalCode,
      notes,
      isPrimary,
    }: AddressCustomerDTO,
  ) {

    const existingAddress = await prisma.customerAddress.findFirst({
      where: {
        customerId: customerId,
        id: addressId,
        deletedAt: null,
      },
    });

    if (!existingAddress) {
      throw AppError("Address not found", 404);
    }

    /* ======================= PROVONSI  ======================= */
    const provRes = await axios.get(
      `https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json`,
    );

    // buat ngecek apakah id di FE sama dengan id di BE
    const province = provRes.data.find((p: any) => Number(p.id) === provinceId);

    if (!province) {
      throw AppError("Invalid province", 400);
    }

    /* ======================= CITY ======================= */

    const cityRes = await axios.get(
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`,
    );

    const city = cityRes.data.find((c: any) => Number(c.id) === cityId);

    if (!city) {
      throw AppError("Invalid city", 400);
    }

    /* ======================= DISTRICT ======================= */

    const districtRes = await axios.get(
      `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`,
    );

    const district = districtRes.data.find(
      (d: any) => Number(d.id) === districtId,
    );

    if (!district) {
      throw AppError("Invalid district", 400);
    }

    /* ======================= OPENCAGE ======================= */
    const fullAddress = `${address}, ${district.name}, ${city.name}, ${province.name}, indonesia`;

    const geoRes = await axios.get(
      "https://api.opencagedata.com/geocode/v1/json",
      {
        params: {
          q: fullAddress,
          key: OPENCAGE_API_KEY,
          countrycode: "id",
          limit: 1,
        },
      },
    );

    const result = geoRes.data.results[0];

    if (!result) {
      throw AppError("Location not found", 400);
    }

    const latitudeGeo = result.geometry.lat;
    const longitudeGeo = result.geometry.lng;

    await prisma.$transaction(async (tx) => {
      if (isPrimary === true) {
        // reset semua primary
        await tx.customerAddress.updateMany({
          where: { customerId },
          data: { isPrimary: false },
        });
      }

      const addressCount = await tx.customerAddress.count({
        where: { customerId },
      });

      return await tx.customerAddress.update({
        where: {
          id: addressId,
          deletedAt: null,
        },
        data: {
          customerId,
          recipientName,
          recipientPhoneNumber,
          label,
          address,
          districtId,
          districtName: district.name,
          cityId,
          cityName: city.name,
          provinceId,
          provinceName: province.name,
          postalCode,
          notes,
          isPrimary: isPrimary || addressCount === 0, // addressCount === 0 => 0 = 0 = true
          latitude: latitudeGeo,
          longitude: longitudeGeo,
        },
      });
    });
  },

  async getAddresses(customerId: string) {

    return await prisma.customerAddress.findMany({
      where: {
        customerId: customerId,
        deletedAt: null,
      },
      orderBy: [
        { isPrimary: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        recipientName: true,
        recipientPhoneNumber: true,
        label: true,
        address: true,
        districtName: true,
        cityName: true,
        provinceName: true,
        postalCode: true,
        notes: true,
        isPrimary: true,
        latitude: true,
        longitude: true,
      },
    });
  },

  async getById(customerId: string, addressId: string) {
    return await prisma.customerAddress.findFirst({
      where: {
        customerId: customerId,
        id: addressId,
        deletedAt: null,
      },
      select: {
        id: true,
        recipientName: true,
        recipientPhoneNumber: true,
        label: true,
        address: true,
        districtId: true,
        districtName: true,
        cityId: true,
        cityName: true,
        provinceId: true,
        provinceName: true,
        postalCode: true,
        notes: true,
        isPrimary: true,
        latitude: true,
        longitude: true,
      },
    });
  },

  async deleteAddress(customerId: string, id: string) {
    const findAddress = await prisma.customerAddress.update({
      where: {
        id: id,
        customerId: customerId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date()
      }
    });

    if (!findAddress) throw AppError("Address not found", 404);

    return {findAddress}

  },
};
