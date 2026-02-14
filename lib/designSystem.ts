/**
 * PATCH_102: Enterprise Design System
 * Centralized design tokens, typography scale, spacing grid, badge system.
 * All UI components MUST reference these tokens.
 * NO random values, NO inline magic numbers.
 */

// ============================================
// 8px SPACING GRID
// ============================================
export const SPACING = {
  xs: "0.25rem",    // 4px  (half-unit)
  sm: "0.5rem",     // 8px  (1 unit)
  md: "1rem",       // 16px (2 units)
  lg: "1.5rem",     // 24px (3 units)
  xl: "2rem",       // 32px (4 units)
  "2xl": "2.5rem",  // 40px (5 units)
  "3xl": "3rem",    // 48px (6 units)
  "4xl": "4rem",    // 64px (8 units)
} as const;

// ============================================
// TYPOGRAPHY SCALE
// ============================================
export const TYPOGRAPHY = {
  h1: "text-3xl font-bold tracking-tight leading-tight",      // 30px
  h2: "text-2xl font-semibold tracking-tight leading-snug",   // 24px
  h3: "text-xl font-semibold leading-snug",                    // 20px
  h4: "text-lg font-medium leading-normal",                    // 18px
  h5: "text-base font-medium leading-normal",                  // 16px
  h6: "text-sm font-medium leading-normal",                    // 14px
  body: "text-sm leading-relaxed",                              // 14px
  bodyLg: "text-base leading-relaxed",                          // 16px
  caption: "text-xs text-slate-400 leading-normal",            // 12px
  overline: "text-xs font-semibold uppercase tracking-wider text-slate-500",
  mono: "font-mono text-xs",
} as const;

// ============================================
// BUTTON VARIANTS
// ============================================
export const BUTTON = {
  base: "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed",
  sizes: {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-sm",
  },
  variants: {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 focus:ring-blue-500 shadow-sm",
    secondary:
      "bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-white/20 active:bg-white/5 focus:ring-white/30",
    destructive:
      "bg-red-600/90 text-white hover:bg-red-500 active:bg-red-700 focus:ring-red-500",
    ghost:
      "text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 focus:ring-white/20",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 focus:ring-emerald-500",
    disabled:
      "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed",
  },
} as const;

export function btn(
  variant: keyof typeof BUTTON.variants = "primary",
  size: keyof typeof BUTTON.sizes = "md"
) {
  return `${BUTTON.base} ${BUTTON.sizes[size]} ${BUTTON.variants[variant]}`;
}

// ============================================
// BADGE SYSTEM (Service types)
// ============================================
export const BADGE = {
  base: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
  variants: {
    microjob: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    aiDataset: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    rental: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    deal: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    buy: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    neutral: "bg-white/5 text-slate-400 border-white/10",
  },
} as const;

export function badge(variant: keyof typeof BADGE.variants = "neutral") {
  return `${BADGE.base} ${BADGE.variants[variant]}`;
}

// ============================================
// CARD STYLES
// ============================================
export const CARD = {
  base: "rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm",
  interactive:
    "rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-200",
  elevated:
    "rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm shadow-xl shadow-black/20",
  padding: {
    sm: "p-3",
    md: "p-4 md:p-6",
    lg: "p-6 md:p-8",
  },
} as const;

// ============================================
// INPUT STYLES
// ============================================
export const INPUT = {
  base: "w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-150 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10",
  select:
    "w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all duration-150 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 appearance-none",
  textarea:
    "w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-150 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 resize-y min-h-[80px]",
  label: "block text-sm font-medium text-slate-300 mb-1.5",
  error: "text-xs text-red-400 mt-1",
  group: "space-y-1",
} as const;

// ============================================
// SHADOWS & RADIUS
// ============================================
export const SHADOW = {
  sm: "shadow-sm shadow-black/10",
  md: "shadow-md shadow-black/20",
  lg: "shadow-lg shadow-black/30",
  xl: "shadow-xl shadow-black/40",
  glow: "shadow-[0_0_30px_rgba(59,130,246,0.15)]",
  none: "shadow-none",
} as const;

export const RADIUS = {
  sm: "rounded-lg",      // 8px
  md: "rounded-xl",      // 12px
  lg: "rounded-2xl",     // 16px
  full: "rounded-full",
} as const;

// ============================================
// STATUS COLOR MAP
// ============================================
export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  // Order statuses
  pending:          { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", dot: "bg-yellow-400" },
  payment_pending:  { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  in_progress:      { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
  completed:        { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  cancelled:        { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400" },
  rejected:         { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400" },
  // Worker statuses
  applied:          { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", dot: "bg-sky-400" },
  approved:         { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  screening_unlocked: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", dot: "bg-indigo-400" },
  screening_in_progress: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", dot: "bg-violet-400" },
  test_submitted:   { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", dot: "bg-purple-400" },
  screening_passed:  { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  screening_failed:  { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400" },
  ready_to_work:    { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", dot: "bg-teal-400" },
  assigned:         { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
  working:          { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", dot: "bg-cyan-400" },
  suspended:        { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", dot: "bg-orange-400" },
  // Rental statuses
  active:           { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  expired:          { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", dot: "bg-slate-400" },
  // Tickets
  open:             { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
  closed:           { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", dot: "bg-slate-400" },
  // Proof
  proof_submitted:  { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", dot: "bg-purple-400" },
  under_review:     { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", dot: "bg-indigo-400" },
  // Generic
  failed:           { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400" },
  processing:       { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", dot: "bg-sky-400" },
};

export function getStatusStyle(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
}

// ============================================
// COMING SOON BANNER
// ============================================
export const COMING_SOON = {
  container: "flex flex-col items-center justify-center py-16 gap-4",
  icon: "w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl",
  title: "text-xl font-semibold text-white",
  subtitle: "text-sm text-slate-400 max-w-md text-center",
} as const;

// ============================================
// PAGE LAYOUT TOKENS
// ============================================
export const PAGE = {
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
  containerNarrow: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
  containerWide: "max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8",
  header: "mb-8",
  section: "mb-8",
  grid2: "grid grid-cols-1 md:grid-cols-2 gap-6",
  grid3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  grid4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
} as const;

// ============================================
// EMPTY STATE
// ============================================
export const EMPTY = {
  container: "flex flex-col items-center justify-center py-20 gap-3",
  icon: "w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-2",
  title: "text-lg font-medium text-white",
  subtitle: "text-sm text-slate-400 text-center max-w-sm",
} as const;
