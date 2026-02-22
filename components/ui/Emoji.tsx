"use client";

/**
 * Clean React Emoji Components
 * Accessible, consistent emoji rendering across the platform.
 * Uses <span role="img"> with aria-label for screen readers.
 */

interface EmojiProps {
  symbol: string;
  label: string;
  className?: string;
}

/** Base emoji wrapper — accessible, inline, no layout shift */
export function Emoji({ symbol, label, className = "" }: EmojiProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-block select-none ${className}`}
    >
      {symbol}
    </span>
  );
}

// ─── Navigation & Section Emojis ────────────────────────────

export const EmojiMarketplace = ({ className }: { className?: string }) => (
  <Emoji symbol="🏪" label="marketplace" className={className} />
);

export const EmojiWork = ({ className }: { className?: string }) => (
  <Emoji symbol="💼" label="work" className={className} />
);

export const EmojiWallet = ({ className }: { className?: string }) => (
  <Emoji symbol="👛" label="wallet" className={className} />
);

export const EmojiOrders = ({ className }: { className?: string }) => (
  <Emoji symbol="📦" label="orders" className={className} />
);

export const EmojiAccount = ({ className }: { className?: string }) => (
  <Emoji symbol="👤" label="account" className={className} />
);

export const EmojiDashboard = ({ className }: { className?: string }) => (
  <Emoji symbol="📊" label="dashboard" className={className} />
);

export const EmojiServices = ({ className }: { className?: string }) => (
  <Emoji symbol="🛠️" label="services" className={className} />
);

export const EmojiWorkforce = ({ className }: { className?: string }) => (
  <Emoji symbol="👷" label="workforce" className={className} />
);

export const EmojiAIData = ({ className }: { className?: string }) => (
  <Emoji symbol="🤖" label="ai data" className={className} />
);

export const EmojiFinance = ({ className }: { className?: string }) => (
  <Emoji symbol="💰" label="finance" className={className} />
);

export const EmojiSupport = ({ className }: { className?: string }) => (
  <Emoji symbol="🎧" label="support" className={className} />
);

export const EmojiSettings = ({ className }: { className?: string }) => (
  <Emoji symbol="⚙️" label="settings" className={className} />
);

export const EmojiDeals = ({ className }: { className?: string }) => (
  <Emoji symbol="🏷️" label="deals" className={className} />
);

export const EmojiAffiliate = ({ className }: { className?: string }) => (
  <Emoji symbol="🤝" label="affiliate" className={className} />
);

export const EmojiRentals = ({ className }: { className?: string }) => (
  <Emoji symbol="🔄" label="rentals" className={className} />
);

export const EmojiNotifications = ({ className }: { className?: string }) => (
  <Emoji symbol="🔔" label="notifications" className={className} />
);

export const EmojiBlogs = ({ className }: { className?: string }) => (
  <Emoji symbol="📝" label="blogs" className={className} />
);

export const EmojiAnalytics = ({ className }: { className?: string }) => (
  <Emoji symbol="📈" label="analytics" className={className} />
);

// ─── Workforce / Projects Emojis ────────────────────────────

export const EmojiJobRoles = ({ className }: { className?: string }) => (
  <Emoji symbol="🎯" label="job roles" className={className} />
);

export const EmojiScreenings = ({ className }: { className?: string }) => (
  <Emoji symbol="📋" label="screenings" className={className} />
);

export const EmojiWorkers = ({ className }: { className?: string }) => (
  <Emoji symbol="🧑‍💻" label="workers" className={className} />
);

export const EmojiProjects = ({ className }: { className?: string }) => (
  <Emoji symbol="📂" label="projects" className={className} />
);

export const EmojiProofs = ({ className }: { className?: string }) => (
  <Emoji symbol="✅" label="proofs" className={className} />
);

export const EmojiDatasets = ({ className }: { className?: string }) => (
  <Emoji symbol="🗃️" label="datasets" className={className} />
);

export const EmojiReviews = ({ className }: { className?: string }) => (
  <Emoji symbol="⭐" label="reviews" className={className} />
);

// ─── Finance Emojis ─────────────────────────────────────────

export const EmojiPayments = ({ className }: { className?: string }) => (
  <Emoji symbol="💳" label="payments" className={className} />
);

export const EmojiWithdrawals = ({ className }: { className?: string }) => (
  <Emoji symbol="🏦" label="withdrawals" className={className} />
);

export const EmojiTickets = ({ className }: { className?: string }) => (
  <Emoji symbol="🎫" label="tickets" className={className} />
);

export const EmojiEarnings = ({ className }: { className?: string }) => (
  <Emoji symbol="💵" label="earnings" className={className} />
);

// ─── Status & Action Emojis ─────────────────────────────────

export const EmojiSuccess = ({ className }: { className?: string }) => (
  <Emoji symbol="✅" label="success" className={className} />
);

export const EmojiWarning = ({ className }: { className?: string }) => (
  <Emoji symbol="⚠️" label="warning" className={className} />
);

export const EmojiError = ({ className }: { className?: string }) => (
  <Emoji symbol="❌" label="error" className={className} />
);

export const EmojiPending = ({ className }: { className?: string }) => (
  <Emoji symbol="⏳" label="pending" className={className} />
);

export const EmojiLock = ({ className }: { className?: string }) => (
  <Emoji symbol="🔒" label="locked" className={className} />
);

export const EmojiStar = ({ className }: { className?: string }) => (
  <Emoji symbol="⭐" label="star" className={className} />
);

export const EmojiRocket = ({ className }: { className?: string }) => (
  <Emoji symbol="🚀" label="rocket" className={className} />
);

export const EmojiSparkles = ({ className }: { className?: string }) => (
  <Emoji symbol="✨" label="sparkles" className={className} />
);

export const EmojiFire = ({ className }: { className?: string }) => (
  <Emoji symbol="🔥" label="fire" className={className} />
);

export const EmojiShield = ({ className }: { className?: string }) => (
  <Emoji symbol="🛡️" label="shield" className={className} />
);

export const EmojiCrown = ({ className }: { className?: string }) => (
  <Emoji symbol="👑" label="crown" className={className} />
);

export const EmojiGlobe = ({ className }: { className?: string }) => (
  <Emoji symbol="🌍" label="globe" className={className} />
);

export const EmojiSearch = ({ className }: { className?: string }) => (
  <Emoji symbol="🔍" label="search" className={className} />
);

export const EmojiChat = ({ className }: { className?: string }) => (
  <Emoji symbol="💬" label="chat" className={className} />
);

export const EmojiEmail = ({ className }: { className?: string }) => (
  <Emoji symbol="📧" label="email" className={className} />
);

export const EmojiCampaigns = ({ className }: { className?: string }) => (
  <Emoji symbol="📣" label="campaigns" className={className} />
);

export const EmojiUsers = ({ className }: { className?: string }) => (
  <Emoji symbol="👥" label="users" className={className} />
);

export const EmojiHome = ({ className }: { className?: string }) => (
  <Emoji symbol="🏠" label="home" className={className} />
);

export const EmojiApply = ({ className }: { className?: string }) => (
  <Emoji symbol="📝" label="apply" className={className} />
);

export const EmojiUpload = ({ className }: { className?: string }) => (
  <Emoji symbol="📤" label="upload" className={className} />
);

export const EmojiCalendar = ({ className }: { className?: string }) => (
  <Emoji symbol="📅" label="calendar" className={className} />
);

export const EmojiTrophy = ({ className }: { className?: string }) => (
  <Emoji symbol="🏆" label="trophy" className={className} />
);

export const EmojiHeart = ({ className }: { className?: string }) => (
  <Emoji symbol="❤️" label="heart" className={className} />
);

export const EmojiMoney = ({ className }: { className?: string }) => (
  <Emoji symbol="💲" label="money" className={className} />
);

export const EmojiWorkspace = ({ className }: { className?: string }) => (
  <Emoji symbol="🖥️" label="workspace" className={className} />
);

export const EmojiMessages = ({ className }: { className?: string }) => (
  <Emoji symbol="💬" label="messages" className={className} />
);

/** Lookup map: key → emoji component for dynamic usage */
export const EMOJI_MAP: Record<string, React.FC<{ className?: string }>> = {
  marketplace: EmojiMarketplace,
  work: EmojiWork,
  wallet: EmojiWallet,
  orders: EmojiOrders,
  account: EmojiAccount,
  dashboard: EmojiDashboard,
  services: EmojiServices,
  workforce: EmojiWorkforce,
  "ai-data": EmojiAIData,
  finance: EmojiFinance,
  support: EmojiSupport,
  settings: EmojiSettings,
  deals: EmojiDeals,
  affiliate: EmojiAffiliate,
  rentals: EmojiRentals,
  notifications: EmojiNotifications,
  blogs: EmojiBlogs,
  analytics: EmojiAnalytics,
  "job-roles": EmojiJobRoles,
  screenings: EmojiScreenings,
  workers: EmojiWorkers,
  projects: EmojiProjects,
  proofs: EmojiProofs,
  datasets: EmojiDatasets,
  reviews: EmojiReviews,
  payments: EmojiPayments,
  withdrawals: EmojiWithdrawals,
  tickets: EmojiTickets,
  earnings: EmojiEarnings,
  campaigns: EmojiCampaigns,
  users: EmojiUsers,
  messages: EmojiMessages,
  workspace: EmojiWorkspace,
};
