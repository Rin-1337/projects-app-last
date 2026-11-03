/**
 * lib/services/vendors.ts — ร้านค้า สินค้า Vendor และบัญชีธนาคาร
 * เจ้าของ: สุรัมภา (Vendor)
 * ข้อมูลที่ดูแล: vendors, vendorProducts, bankAccounts
 *
 * วิริญา (Organizer) เรียก reviewVendorProduct เพื่ออนุมัติ/ปฏิเสธสินค้า
 * นัฐวิ (Admin) เรียก setVendorApproval เพื่ออนุมัติร้าน
 * ทิวากร (Customer) เรียก getVendorByQr ตอนสแกน QR ร้าน
 */
import type {
  ApprovalStatus,
  BankAccount,
  ID,
  Vendor,
  VendorProduct,
} from "../types";
import { notImplemented } from "./_todo";

export function getVendorByUser(userId: ID): Vendor | undefined {
  void userId;
  return notImplemented("getVendorByUser");
}

export function getVendorByQr(qrCode: string): Vendor | undefined {
  void qrCode;
  return notImplemented("getVendorByQr");
}

export function listVendorsByEvent(eventId: ID): Vendor[] {
  void eventId;
  return notImplemented("listVendorsByEvent");
}

export function saveVendor(vendor: Vendor): Vendor {
  void vendor;
  return notImplemented("saveVendor");
}

/** Admin อนุมัติ/ปฏิเสธร้าน */
export function setVendorApproval(vendorId: ID, status: ApprovalStatus): Vendor {
  void vendorId;
  void status;
  return notImplemented("setVendorApproval");
}

export function listVendorProducts(vendorId: ID): VendorProduct[] {
  void vendorId;
  return notImplemented("listVendorProducts");
}

/** Vendor ส่งสินค้า (สถานะเริ่มต้น pending) */
export function submitVendorProduct(product: VendorProduct): VendorProduct {
  void product;
  return notImplemented("submitVendorProduct");
}

/** Organizer อนุมัติ/ปฏิเสธสินค้า */
export function reviewVendorProduct(input: {
  productId: ID;
  status: "approved" | "rejected";
  reviewerId: ID;
  rejectReason?: string;
}): VendorProduct {
  void input;
  return notImplemented("reviewVendorProduct");
}

export function listBankAccounts(vendorId: ID): BankAccount[] {
  void vendorId;
  return notImplemented("listBankAccounts");
}

export function saveBankAccount(account: BankAccount): BankAccount {
  void account;
  return notImplemented("saveBankAccount");
}
