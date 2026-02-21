/* Design System Tokens — JS access */

export const tokens = {
  color: {
    bgPrimary: "var(--color-bg-primary)",
    bgSecondary: "var(--color-bg-secondary)",
    bgTertiary: "var(--color-bg-tertiary)",
    bgElevated: "var(--color-bg-elevated)",
    bgHover: "var(--color-bg-hover)",
    textPrimary: "var(--color-text-primary)",
    textSecondary: "var(--color-text-secondary)",
    textTertiary: "var(--color-text-tertiary)",
    border: "var(--color-border)",
    brand: "var(--color-brand)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    error: "var(--color-error)",
    info: "var(--color-info)",
  },
  intent: {
    buy: "var(--color-intent-buy)",
    earn: "var(--color-intent-earn)",
    rent: "var(--color-intent-rent)",
    deal: "var(--color-intent-deal)",
  },
} as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  // Order
  pending: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning)" },
  in_progress: { bg: "var(--color-info-bg)", text: "var(--color-info)", border: "var(--color-info)" },
  waiting_user: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning)" },
  completed: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success)" },
  cancelled: { bg: "var(--color-error-bg)", text: "var(--color-error)", border: "var(--color-error)" },
  // Rental
  active: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success)" },
  expired: { bg: "var(--color-error-bg)", text: "var(--color-error)", border: "var(--color-error)" },
  renewed: { bg: "var(--color-info-bg)", text: "var(--color-info)", border: "var(--color-info)" },
  // Wallet
  initiated: { bg: "var(--color-info-bg)", text: "var(--color-info)", border: "var(--color-info)" },
  paid_unverified: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning)" },
  success: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success)" },
  failed: { bg: "var(--color-error-bg)", text: "var(--color-error)", border: "var(--color-error)" },
  // Worker
  applied: { bg: "var(--color-info-bg)", text: "var(--color-info)", border: "var(--color-info)" },
  screening_unlocked: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning)" },
  training_viewed: { bg: "var(--color-info-bg)", text: "var(--color-info)", border: "var(--color-info)" },
  test_submitted: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning)" },
  ready_to_work: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success)" },
  assigned: { bg: "var(--color-brand-light)", text: "var(--color-brand)", border: "var(--color-brand)" },
  working: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success)" },
  suspended: { bg: "var(--color-error-bg)", text: "var(--color-error)", border: "var(--color-error)" },
  fresh: { bg: "var(--color-info-bg)", text: "var(--color-info)", border: "var(--color-info)" },
  screening_available: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning)" },
  inactive: { bg: "var(--color-error-bg)", text: "var(--color-error)", border: "var(--color-error)" },
  // Withdrawal
  approved: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success)" },
  rejected: { bg: "var(--color-error-bg)", text: "var(--color-error)", border: "var(--color-error)" },
  paid: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success)" },
  // Ticket
  open: { bg: "var(--color-info-bg)", text: "var(--color-info)", border: "var(--color-info)" },
  resolved: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success)" },
  closed: { bg: "var(--color-text-tertiary)", text: "var(--color-text-tertiary)", border: "var(--color-text-tertiary)" },
  // Project
  draft: { bg: "var(--color-text-tertiary)", text: "var(--color-text-tertiary)", border: "var(--color-text-tertiary)" },
  submitted: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning)" },
  // RLHF
  pending_review: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning)" },
  // Proof
  unpaid: { bg: "var(--color-error-bg)", text: "var(--color-error)", border: "var(--color-error)" },
  refunded: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning)" },
};
