/* ─── ENDPOINT CONSTANTS ─── */
// Maps 1:1 to backend route mounts from UREMO_FULL_STRUCTURAL_CONTRACT.json

export const EP = {
  // Auth
  AUTH_SIGNUP: "/api/auth/signup",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_FORGOT_PASSWORD: "/api/auth/forgot-password",
  AUTH_RESET_PASSWORD: "/api/auth/reset-password",
  AUTH_ME: "/api/auth/me",
  AUTH_PROFILE: "/api/auth/profile",
  AUTH_ONBOARDING: "/api/auth/onboarding",
  AUTH_MAKE_ADMIN: "/api/auth/make-admin",
  AUTH_SETUP_RESET: "/api/auth/setup/reset-password",

  // Services
  SERVICES: "/api/services",
  SERVICES_MARKETPLACE: "/api/services/marketplace",
  SERVICES_MARKETPLACE_FILTERS: "/api/services/marketplace/filters",
  SERVICES_WORKSPACE: "/api/services/workspace",
  SERVICES_DEALS: "/api/services/deals",
  SERVICES_ADMIN_ALL: "/api/services/admin/all",
  SERVICE_BY_ID: (id: string) => `/api/services/${id}`,
  SERVICE_ACTIONS: (id: string) => `/api/services/${id}/actions`,

  // Orders
  ORDERS: "/api/orders",
  ORDERS_MY: "/api/orders/my",
  ORDERS_DEAL: "/api/orders/deal",
  ORDER_BY_ID: (id: string) => `/api/orders/${id}`,
  ORDER_PAYMENT: (id: string) => `/api/orders/${id}/payment`,
  ORDER_MESSAGES: (id: string) => `/api/orders/${id}/messages`,
  ORDER_MESSAGES_STREAM: (id: string) => `/api/orders/${id}/messages/stream`,

  // Rentals
  RENTALS: "/api/rentals",
  RENTALS_CREATE: "/api/rentals/create",
  RENTALS_MY: "/api/rentals/my",
  RENTAL_BY_ID: (id: string) => `/api/rentals/${id}`,
  RENTAL_CANCEL: (id: string) => `/api/rentals/${id}/cancel`,
  RENTAL_RENEW: (id: string) => `/api/rentals/${id}/renew`,

  // Wallet
  WALLET_BALANCE: "/api/wallet/balance",
  WALLET_TOPUP: "/api/wallet/topup",
  WALLET_PENDING: "/api/wallet/pending",
  WALLET_CANCEL_TOPUP: "/api/wallet/cancel-topup",
  WALLET_PAYPAL_AVAILABLE: "/api/wallet/topup/paypal/available",
  WALLET_PAYPAL_CREATE: "/api/wallet/topup/paypal/create",
  WALLET_PAYPAL_CONFIRM: "/api/wallet/topup/paypal/confirm",
  WALLET_TRANSACTIONS: "/api/wallet/transactions",
  WALLET_PAY: "/api/wallet/pay",
  WALLET_WITHDRAW: "/api/wallet/withdraw",
  WALLET_WITHDRAWALS: "/api/wallet/withdrawals",

  // Upload
  UPLOAD_CHAT: "/api/upload/chat",
  UPLOAD_CHAT_MULTIPLE: "/api/upload/chat/multiple",
  UPLOAD_IMAGE: "/api/upload/image",
  UPLOAD_PAYMENT_PROOF: "/api/upload/payment-proof",
  UPLOAD_PAYMENT_PROOF_ORDER: (orderId: string) => `/api/upload/payment-proof/${orderId}`,

  // Payment
  PAYMENT_METHODS: "/api/payment",
  PAYMENT_CHECKOUT: "/api/payment/checkout",
  PAYMENT_METHODS_PUBLIC: "/api/payment-methods",
  PAYMENT_METHODS_ADMIN: "/api/payment-methods/admin",
  PAYMENT_METHODS_ADMIN_BY_ID: (id: string) => `/api/payment-methods/admin/${id}`,

  // Blogs
  BLOGS: "/api/blogs",
  BLOG_BY_SLUG: (slug: string) => `/api/blogs/${slug}`,

  // Tickets
  TICKETS: "/api/tickets",
  TICKETS_UNREAD: "/api/tickets/unread",
  TICKETS_ORDERS: "/api/tickets/orders",
  TICKET_BY_ID: (id: string) => `/api/tickets/${id}`,
  TICKET_MESSAGES: (id: string) => `/api/tickets/${id}/messages`,
  TICKET_REPLY: (id: string) => `/api/tickets/${id}/reply`,

  // Notifications
  NOTIFICATIONS: "/api/notifications",
  NOTIFICATIONS_UNREAD: "/api/notifications/unread-count",
  NOTIFICATION_READ: (id: string) => `/api/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: "/api/notifications/read-all",

  // Affiliate
  AFFILIATE_STATS: "/api/affiliate/stats",
  AFFILIATE_TRANSACTIONS: "/api/affiliate/transactions",
  AFFILIATE_COMMISSIONS: "/api/affiliate/commissions",
  AFFILIATE_WITHDRAWALS: "/api/affiliate/withdrawals",
  AFFILIATE_WITHDRAW: "/api/affiliate/withdraw",

  // Service requests
  SERVICE_REQUESTS: "/api/service-requests",
  SERVICE_REQUESTS_MY: "/api/service-requests/my",

  // Workspace
  WORKSPACE_PROFILE: "/api/workspace/profile",
  WORKSPACE_APPLY: (jobId: string) => `/api/workspace/apply/${jobId}`,
  WORKSPACE_APP_TRAINING: (appId: string) => `/api/workspace/application/${appId}/mark-training-viewed`,
  WORKSPACE_SCREENINGS: "/api/workspace/screenings",
  WORKSPACE_SCREENING: (id: string) => `/api/workspace/screening/${id}`,
  WORKSPACE_SCREENING_SUBMIT: (id: string) => `/api/workspace/screening/${id}/submit`,
  WORKSPACE_PROJECTS: "/api/workspace/projects",
  WORKSPACE_PROJECT: (id: string) => `/api/workspace/project/${id}`,
  WORKSPACE_PROJECT_START: (id: string) => `/api/workspace/project/${id}/start`,
  WORKSPACE_PROJECT_SUBMIT: (id: string) => `/api/workspace/project/${id}/submit`,
  WORKSPACE_MY_PROOFS: "/api/workspace/my-proofs",
  WORKSPACE_PROJECT_PROOF: (id: string) => `/api/workspace/project/${id}/proof`,
  WORKSPACE_PROJECT_RLHF_TASKS: (id: string) => `/api/workspace/project/${id}/rlhf-tasks`,
  WORKSPACE_PROJECT_RLHF_SUBMIT: (id: string) => `/api/workspace/project/${id}/rlhf-submit`,
  WORKSPACE_EARNINGS: "/api/workspace/earnings",
  WORKSPACE_WITHDRAW: "/api/workspace/withdraw",

  // Apply Work
  APPLY_WORK: "/api/apply-work",
  APPLY_WORK_ME: "/api/apply-work/me",
  APPLY_WORK_ADMIN: "/api/apply-work/admin",
  APPLY_WORK_ADMIN_BY_ID: (id: string) => `/api/apply-work/admin/${id}`,

  // Work Positions
  WORK_POSITIONS: "/api/work-positions",
  WORK_POSITIONS_BY_SERVICE: (sId: string) => `/api/work-positions/by-service/${sId}`,

  // FAQs
  FAQS: "/api/faqs",
  FAQS_ADMIN: "/api/faqs/admin",
  FAQ_BY_ID: (id: string) => `/api/faqs/${id}`,

  // Public
  PUBLIC_TRUST: "/api/public/trust",
  PUBLIC_CATEGORIES: "/api/public/categories",
  PUBLIC_STATS: "/api/public/stats",

  // Settings
  SETTINGS_PUBLIC: "/api/settings/public",

  // Health
  HEALTH: "/api/health",

  // Proofs
  PROOFS_PUBLIC: "/api/proofs/public",

  // User preferences
  USER_PREFERENCES: "/api/users/preferences",

  // JarvisX (proxied via Next.js API routes)
  JARVISX_CHAT: "/api/jarvisx/chat",
  JARVISX_PING: "/api/jarvisx/ping",
  JARVISX_HEALTH: "/api/jarvisx/health-report",

  /* ─── ADMIN ROUTES ─── */
  ADMIN_ORDERS: "/api/admin/orders",
  ADMIN_ORDERS_REJECTED: "/api/admin/orders/rejected",
  ADMIN_ORDERS_CANCELLED: "/api/admin/orders/cancelled",
  ADMIN_ORDER_BY_ID: (id: string) => `/api/admin/orders/${id}`,
  ADMIN_ORDER_VERIFY: (id: string) => `/api/admin/orders/${id}/verify-payment`,
  ADMIN_ORDER_ARCHIVE_REJECTED: (id: string) => `/api/admin/orders/${id}/archive-rejected`,
  ADMIN_ORDER_ARCHIVE_CANCELLED: (id: string) => `/api/admin/orders/${id}/archive-cancelled`,
  ADMIN_ORDER_UNARCHIVE_REJECTED: (id: string) => `/api/admin/orders/${id}/unarchive-rejected`,
  ADMIN_ORDER_UNARCHIVE_CANCELLED: (id: string) => `/api/admin/orders/${id}/unarchive-cancelled`,
  ADMIN_ORDER_NOTE: (id: string) => `/api/admin/orders/${id}/note`,
  ADMIN_ORDER_REPLY: (id: string) => `/api/admin/orders/${id}/reply`,
  ADMIN_ORDER_MARK_READ: (id: string) => `/api/admin/orders/${id}/support/mark-read`,
  ADMIN_MESSAGES: "/api/admin/messages",
  ADMIN_MESSAGES_UNREAD: "/api/admin/messages/unread",

  ADMIN_SERVICES: "/api/admin/services",
  ADMIN_SERVICES_LIST: "/api/admin/services/list",
  ADMIN_SERVICE_BY_ID: (id: string) => `/api/admin/services/${id}`,
  ADMIN_SERVICE_CREATE: "/api/admin/services/create",
  ADMIN_SERVICE_ACTIVATE: (id: string) => `/api/admin/services/${id}/activate`,
  ADMIN_SERVICE_DEACTIVATE: (id: string) => `/api/admin/services/${id}/deactivate`,
  ADMIN_SERVICE_ARCHIVE: (id: string) => `/api/admin/services/${id}/archive`,
  ADMIN_SERVICE_REPAIR: "/api/admin/services/repair-legacy",
  ADMIN_UPLOAD_IMAGES: "/api/admin/upload-images",

  ADMIN_RENTALS: "/api/admin/rentals",
  ADMIN_RENTALS_METRICS: "/api/admin/rentals/metrics",
  ADMIN_RENTAL_ACTIVATE: (id: string) => `/api/admin/rentals/${id}/activate`,
  ADMIN_RENTAL_CANCEL: (id: string) => `/api/admin/rentals/${id}/cancel`,
  ADMIN_RENTAL_ACCESS: (id: string) => `/api/admin/rentals/${id}/access`,

  ADMIN_WALLET_STATS: "/api/admin/wallet/stats",
  ADMIN_WALLET_PENDING: "/api/admin/wallet/pending-topups",
  ADMIN_WALLET_VERIFY: "/api/admin/wallet/verify-topup",
  ADMIN_WALLET_USERS: "/api/admin/wallet/users",
  ADMIN_WALLET_SEARCH: "/api/admin/wallet/search",
  ADMIN_WALLET_USER: (userId: string) => `/api/admin/wallet/user/${userId}`,
  ADMIN_WALLET_ADJUST: "/api/admin/wallet/adjust",
  ADMIN_WALLET_WITHDRAWALS: "/api/admin/wallet/withdrawals",
  ADMIN_WALLET_WITHDRAWAL_APPROVE: (id: string) => `/api/admin/wallet/withdrawals/${id}/approve`,
  ADMIN_WALLET_WITHDRAWAL_PAY: (id: string) => `/api/admin/wallet/withdrawals/${id}/pay`,
  ADMIN_WALLET_WITHDRAWAL_REJECT: (id: string) => `/api/admin/wallet/withdrawals/${id}/reject`,
  ADMIN_WALLET_FINANCE: "/api/admin/wallet/finance",

  ADMIN_PAYMENTS: "/api/admin/payments",
  ADMIN_PAYMENT_BY_ID: (id: string) => `/api/admin/payments/${id}`,

  ADMIN_SERVICE_REQUESTS: "/api/admin/service-requests",
  ADMIN_SERVICE_REQUEST_BY_ID: (id: string) => `/api/admin/service-requests/${id}`,

  ADMIN_USERS: "/api/admin/users",
  ADMIN_TEST_EMAIL: "/api/admin/test-email",
  ADMIN_USER_EXISTS: "/api/admin/debug/user-exists",
  ADMIN_EMAIL_CAMPAIGNS: "/api/admin/email-campaigns",
  ADMIN_RESET_WALLETS: "/api/admin/reset/wallets",
  ADMIN_RESET_AFFILIATE: "/api/admin/reset/affiliate",
  ADMIN_RESET_ALL: "/api/admin/reset/all-test-data",

  ADMIN_BLOGS: "/api/admin/blogs",
  ADMIN_BLOG_BY_ID: (id: string) => `/api/admin/blogs/${id}`,

  ADMIN_TICKETS: "/api/admin/tickets",
  ADMIN_TICKETS_UNREAD: "/api/admin/tickets/unread",
  ADMIN_TICKETS_ADMINS: "/api/admin/tickets/admins",
  ADMIN_TICKET_BY_ID: (id: string) => `/api/admin/tickets/${id}`,
  ADMIN_TICKET_MESSAGES: (id: string) => `/api/admin/tickets/${id}/messages`,
  ADMIN_TICKET_NOTES: (id: string) => `/api/admin/tickets/${id}/notes`,
  ADMIN_TICKET_REPLY: (id: string) => `/api/admin/tickets/${id}/reply`,
  ADMIN_TICKET_STATUS: (id: string) => `/api/admin/tickets/${id}/status`,
  ADMIN_TICKET_ASSIGN: (id: string) => `/api/admin/tickets/${id}/assign`,
  ADMIN_TICKET_CLOSE: (id: string) => `/api/admin/tickets/${id}/close`,

  ADMIN_ANALYTICS_DASHBOARD: "/api/admin/analytics/dashboard",
  ADMIN_ANALYTICS_CHARTS: "/api/admin/analytics/charts",
  ADMIN_ANALYTICS_HEALTH: "/api/admin/analytics/health",

  ADMIN_WORKSPACE_WORKERS: "/api/admin/workspace/workers",
  ADMIN_WORKSPACE_WORKERS_QUALIFIED: "/api/admin/workspace/workers/qualified-count",
  ADMIN_WORKSPACE_WORKER: (id: string) => `/api/admin/workspace/worker/${id}`,
  ADMIN_WORKSPACE_WORKER_STATUS: (id: string) => `/api/admin/workspace/worker/${id}/status`,
  ADMIN_WORKSPACE_WORKER_ASSIGN: (id: string) => `/api/admin/workspace/workers/${id}/assign-task`,
  ADMIN_WORKSPACE_SCREENINGS: "/api/admin/workspace/screenings",
  ADMIN_WORKSPACE_SCREENING: (id: string) => `/api/admin/workspace/screenings/${id}`,
  ADMIN_WORKSPACE_SCREENING_CLONE: (id: string) => `/api/admin/workspace/screenings/${id}/clone`,
  ADMIN_WORKSPACE_SCREENING_SUBMISSIONS: "/api/admin/workspace/screening-submissions",
  ADMIN_WORKSPACE_SCREENING_REVIEW: (wId: string) => `/api/admin/workspace/screening-submissions/${wId}/review`,
  ADMIN_WORKSPACE_PROJECTS: "/api/admin/workspace/projects",
  ADMIN_WORKSPACE_PROJECT: (id: string) => `/api/admin/workspace/project/${id}`,
  ADMIN_WORKSPACE_PROJECT_ELIGIBLE: (id: string) => `/api/admin/workspace/project/${id}/eligible-workers`,
  ADMIN_WORKSPACE_PROJECT_ASSIGN: (id: string) => `/api/admin/workspace/project/${id}/assign`,
  ADMIN_WORKSPACE_PROJECT_CREDIT: (id: string) => `/api/admin/workspace/project/${id}/credit`,

  ADMIN_WORKSPACE_JOBS: "/api/admin/workspace/jobs",
  ADMIN_WORKSPACE_JOB: (id: string) => `/api/admin/workspace/job/${id}`,
  ADMIN_WORKSPACE_JOB_APPLICANTS: (id: string) => `/api/admin/workspace/job/${id}/applicants`,
  ADMIN_WORKSPACE_JOB_APPROVE: (id: string) => `/api/admin/workspace/job/${id}/approve`,
  ADMIN_WORKSPACE_JOB_REJECT: (id: string) => `/api/admin/workspace/job/${id}/reject`,
  ADMIN_WORKSPACE_JOB_UNLOCK_SCREENING: (id: string) => `/api/admin/workspace/job/${id}/unlock-screening`,
  ADMIN_WORKSPACE_JOB_SET_TRAINING: (id: string) => `/api/admin/workspace/job/${id}/set-training`,
  ADMIN_WORKSPACE_JOB_SET_SCREENING: (id: string) => `/api/admin/workspace/job/${id}/set-screening`,
  ADMIN_WORKSPACE_JOB_ASSIGN_PROJECT: (id: string) => `/api/admin/workspace/job/${id}/assign-project`,
  ADMIN_WORKSPACE_JOB_SET_STATUS: (id: string) => `/api/admin/workspace/job/${id}/set-status`,
  ADMIN_WORKSPACE_JOB_PROJECTS: (id: string) => `/api/admin/workspace/job/${id}/projects`,
  ADMIN_WORKSPACE_JOB_PROJECTS_ACTIVATE: (jId: string, pId: string) => `/api/admin/workspace/job/${jId}/projects/${pId}/activate`,
  ADMIN_WORKSPACE_JOB_CREDIT_WORKER: (id: string) => `/api/admin/workspace/job/${id}/credit-worker`,

  ADMIN_PROOFS: "/api/admin/proofs",
  ADMIN_PROOF_BY_ID: (id: string) => `/api/admin/proofs/${id}`,
  ADMIN_PROOF_APPROVE: (id: string) => `/api/admin/proofs/${id}/approve`,
  ADMIN_PROOF_REJECT: (id: string) => `/api/admin/proofs/${id}/reject`,

  ADMIN_DATASETS: "/api/admin/datasets",
  ADMIN_DATASET_BY_ID: (id: string) => `/api/admin/datasets/${id}`,
  ADMIN_DATASET_TASKS: (id: string) => `/api/admin/datasets/${id}/tasks`,
  ADMIN_DATASET_TASKS_BULK: (id: string) => `/api/admin/datasets/${id}/tasks/bulk`,
  ADMIN_DATASET_TASK_BY_ID: (dId: string, tId: string) => `/api/admin/datasets/${dId}/tasks/${tId}`,
  ADMIN_RLHF_SUBMISSIONS: "/api/admin/datasets/rlhf/submissions",
  ADMIN_RLHF_SUBMISSION_REVIEW: (sId: string) => `/api/admin/datasets/rlhf/submissions/${sId}/review`,

  ADMIN_AFFILIATE_LIST: "/api/admin/affiliate/affiliates",
  ADMIN_AFFILIATE_BY_ID: (id: string) => `/api/admin/affiliate/affiliates/${id}`,
  ADMIN_AFFILIATE_TRANSACTIONS: "/api/admin/affiliate/transactions",
  ADMIN_AFFILIATE_WITHDRAWALS: "/api/admin/affiliate/withdrawals",
  ADMIN_AFFILIATE_WITHDRAWAL_APPROVE: (id: string) => `/api/admin/affiliate/withdrawals/${id}/approve`,
  ADMIN_AFFILIATE_WITHDRAWAL_REJECT: (id: string) => `/api/admin/affiliate/withdrawals/${id}/reject`,

  ADMIN_WORK_POSITIONS: "/api/admin/work-positions",
  ADMIN_WORK_POSITION_BY_ID: (id: string) => `/api/admin/work-positions/${id}`,

  ADMIN_SETTINGS: "/api/admin/settings",
  ADMIN_SETTINGS_RAW: "/api/admin/settings/raw",

  ADMIN_CAMPAIGNS_SEND: "/api/admin/campaigns/send",
  ADMIN_CAMPAIGNS_EVENTS: "/api/admin/campaigns/events",

  ENGAGEMENT_RUN_CYCLE: "/api/engagement/run-cycle",
  ENGAGEMENT_SIGNUP_NUDGE: "/api/engagement/signup-nudge",
  ENGAGEMENT_SCREENING_NUDGE: "/api/engagement/screening-nudge",
  ENGAGEMENT_NOTIFY_READY: "/api/engagement/notify-ready-workers",
  ENGAGEMENT_NOTIFY_INTERESTED: "/api/engagement/notify-interested-users",
  ENGAGEMENT_STATUS: "/api/engagement/status",
} as const;
