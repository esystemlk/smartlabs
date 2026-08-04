import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalise a phone number to its last 9 significant digits so the same
 * subscriber matches regardless of how it was typed. Sri Lankan mobiles are
 * 9 digits after the leading 0 / +94 country code:
 *   "077 123 4567", "0771234567", "+94771234567", "94 77 123 4567"  →  "771234567"
 * Used to match a WhatsApp join-request number against a paid enrollment.
 */
export function phoneKey(raw: string | null | undefined): string {
  return String(raw ?? '').replace(/\D/g, '').slice(-9);
}
