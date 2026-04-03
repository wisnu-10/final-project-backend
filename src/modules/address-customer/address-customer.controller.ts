import { Request, Response } from "express";
import { AddressCustomerDTO } from "../../types/addressCustomer.dto";
import { addressCustomerService } from "./address-customer.service";

export const addressCustomerController = {
  async createAddress(req: Request, res: Response) {
    const { customerId } = res.locals.payload;

    const address = req.body as AddressCustomerDTO;

    await addressCustomerService.createAddress(customerId, address);

    res.status(200).json({
      success: true,
      message: "Address created successfully",
      data: {
        address,
      },
    });
  },

  async updateAddress(req: Request, res: Response) {
    const { customerId } = res.locals.payload;

    const address = req.body as AddressCustomerDTO;

    await addressCustomerService.updateAddress(customerId, address);

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: {
        recipientName: address.recipientName,
        recipientPhoneNumber: address.recipientPhoneNumber,
        label: address.label,
        address: address.address,
        postalCode: address.postalCode,
        cityName: address.cityName,
        provinceName: address.provinceName,
        districtName: address.districtName,
        note: address.notes,
        latitude: address.latitude,
        longitude: address.longitude,
        isPrimary: address.isPrimary
      },
    });
  },

  async getAddresses(req: Request, res: Response) {
    const { customerId } = res.locals.payload;

    const addresses = await addressCustomerService.getAddresses(customerId);

    res.status(200).json({
      success: true,
      message: "Addresses retrieved successfully",
      data: {
        addresses,
      },
    });
  },

  async getById(req: Request, res: Response) {
    const { customerId } = res.locals.payload;
    const { addressId } = req.params

    const address = await addressCustomerService.getById(customerId, addressId as string);

    res.status(200).json({
      success: true,
      message: "Address retrieved successfully",
      data: {
        address
      }
    });

  },

  async deleteAddress(req: Request, res: Response) {
    const { customerId } = res.locals.payload;

    const result = await addressCustomerService.deleteAddress(customerId);

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      data: {
        result
      }
    })
  },
};
