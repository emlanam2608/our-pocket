import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatInputNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  
  // Preserve sequences of zeros (e.g., "000") to allow easier typing/editing
  if (/^0+$/.test(digits)) return digits;

  // Convert to number and back to string to remove unwanted leading zeros (e.g., "0500" -> "500")
  // but keep the dot formatting
  const numValue = parseInt(digits, 10);
  return String(numValue).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseInputNumber(value: string): number {
  const digits = value.replace(/\D/g, "");
  return parseInt(digits, 10) || 0;
}
