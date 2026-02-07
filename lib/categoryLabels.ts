/**
 * PATCH_54: Frontend Category Label Mapping
 *
 * This file transforms backend category enum values into user-friendly labels.
 * IMPORTANT: This is FRONTEND-ONLY transformation.
 * DO NOT change backend enums - only map them here for display.
 */

// Category enum → Friendly label mapping
export const CATEGORY_LABELS: Record<string, string> = {
  // Primary categories
  microjobs: "Online Gigs & Tasks",
  writing: "Writing & Content",
  online_gigs: "Remote Work",
  forex_crypto: "Forex & Crypto Platforms",
  banks_gateways_wallets: "Banks & Payment Gateways",
  banks_wallets: "Banks & Wallets",
  crypto_accounts: "Crypto Accounts",
  forex_accounts: "Forex Trading",
  rentals: "Rentals & Subscriptions",
  general: "General Services",
};

// Subcategory enum → Friendly label mapping
export const SUBCATEGORY_LABELS: Record<string, string> = {
  // Microjobs subcategories
  fresh_account: "Fresh Account (With Screening)",
  already_onboarded: "Already Onboarded (Instant)",

  // Forex/Crypto subcategories
  forex_platform_creation: "Forex Trading Platform",
  crypto_platform_creation: "Crypto Exchange Account",

  // Banks subcategories
  banks: "Bank Account",
  payment_gateways: "Payment Gateway",
  wallets: "Digital Wallet",

  // Rentals subcategories
  account_rental: "Account Rental",
  whatsapp_business_verified: "WhatsApp Business",

  // Default
  general: "General",
};

/**
 * Get user-friendly category label
 * Falls back to formatted enum if not mapped
 */
export function getCategoryLabel(category: string | undefined): string {
  if (!category) return "Service";
  const label = CATEGORY_LABELS[category];
  if (label) return label;
  // Fallback: convert snake_case to Title Case
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get user-friendly subcategory label
 */
export function getSubcategoryLabel(subcategory: string | undefined): string {
  if (!subcategory) return "";
  const label = SUBCATEGORY_LABELS[subcategory];
  if (label) return label;
  return subcategory
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get short category label for badges (max 2-3 words)
 */
export function getShortCategoryLabel(category: string | undefined): string {
  if (!category) return "Service";

  const shortLabels: Record<string, string> = {
    microjobs: "Gigs",
    writing: "Writing",
    online_gigs: "Remote",
    forex_crypto: "Forex/Crypto",
    banks_gateways_wallets: "Banks",
    banks_wallets: "Banks",
    crypto_accounts: "Crypto",
    forex_accounts: "Forex",
    rentals: "Rentals",
    general: "General",
  };

  return shortLabels[category] || getCategoryLabel(category);
}

// PATCH_72: Job Role / Project Category Labels
export const JOB_ROLE_CATEGORY_LABELS: Record<string, string> = {
  data_entry: "Data Entry",
  screener: "Screener",
  customer_support: "Customer Support",
  operations_support: "Operations Support",
  marketing: "Marketing",
  social_media: "Social Media",
  content_writing: "Content Writing",
  general: "General",
};

/**
 * Get user-friendly job role category label
 * PATCH_72: Converts "data_entry" → "Data Entry"
 */
export function getJobRoleCategoryLabel(category: string | undefined): string {
  if (!category) return "General";
  const label = JOB_ROLE_CATEGORY_LABELS[category];
  if (label) return label;
  // Fallback: convert snake_case to Title Case
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
