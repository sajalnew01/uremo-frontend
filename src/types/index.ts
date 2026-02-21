/* ─── CORE DOMAIN TYPES ─── */
// Mirror backend models 1:1

export type Intent = "all" | "buy" | "earn" | "rent" | "deal";

export type ServiceCategory =
  | "microjobs" | "writing" | "online_gigs"
  | "banks_wallets" | "crypto_accounts" | "forex_accounts"
  | "rentals" | "general" | "forex_crypto" | "banks_gateways_wallets";

export type ServiceSubcategory =
  | "bank_accounts" | "payment_wallets" | "crypto_wallets" | "crypto_exchanges"
  | "forex_mt5" | "forex_prop" | "resume_writing" | "academic_writing"
  | "copywriting" | "content_writing" | "data_entry" | "virtual_assistant";

export type ServiceStatus = "draft" | "active" | "archived";
export type DeliveryType = "instant" | "manual" | "assisted";

export interface AllowedActions {
  buy: boolean;
  apply: boolean;
  rent: boolean;
  deal: boolean;
}

export interface RentalPlan {
  label: string;
  duration: number;
  price: number;
  type: string;
  maxSlots?: number;
}

export interface Service {
  _id: string;
  title: string;
  slug: string;
  category: ServiceCategory;
  subcategory?: ServiceSubcategory;
  description: string;
  price: number;
  currency: string;
  deliveryType: DeliveryType;
  status: ServiceStatus;
  images: string[];
  imageUrl?: string;
  requirements?: string;
  countries?: string[];
  countryPricing?: Record<string, number>;
  platform?: string;
  subject?: string;
  projectName?: string;
  payRate?: number;
  instantDelivery?: boolean;
  isRental?: boolean;
  rentalPlans: RentalPlan[];
  allowedActions: AllowedActions;
  linkedJobId?: string;
  currentActiveRentals?: number;
  intentPriority?: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── ORDER ─── */
export type OrderStatus = "pending" | "in_progress" | "waiting_user" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "pending_verification";
export type OrderType = "buy" | "rental" | "deal";

export interface Order {
  _id: string;
  userId: string | User;
  serviceId: string | Service;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | PaymentMethod;
  dealPercent?: number;
  rentalId?: string;
  expiresAt?: string;
  payment?: {
    proofUrl?: string;
    proofPublicId?: string;
    proofResourceType?: string;
    proofFormat?: string;
    reference?: string;
    paidAt?: string;
    verifiedAt?: string;
    verifiedBy?: string;
  };
  statusLog?: Array<{ status: string; at: string; by?: string }>;
  timeline?: Array<{ action: string; at: string; by?: string }>;
  notes?: string[];
  assignedWorker?: string;
  isRejectedArchive?: boolean;
  orderNumber?: string;
  totalAmount?: number;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── RENTAL ─── */
export type RentalStatus = "pending" | "active" | "expired" | "cancelled" | "renewed";

export interface Rental {
  _id: string;
  user: string | User;
  service: string | Service;
  order: string | Order;
  rentalType: string;
  duration: number;
  price: number;
  startDate: string;
  endDate: string;
  status: RentalStatus;
  accessDetails?: string;
  renewalCount: number;
  previousRental?: string;
  statusLog?: Array<{ status: string; at: string; by?: string }>;
  timeline?: Array<{ action: string; at: string; by?: string }>;
  daysRemaining?: number;
  isActive?: boolean;
  isExpiringSoon?: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ─── WALLET / FINANCE ─── */
export type TransactionType = "credit" | "debit";
export type TransactionSource =
  | "topup" | "manual_topup" | "paypal_topup"
  | "purchase" | "wallet_payment"
  | "withdrawal" | "admin_adjustment"
  | "referral_bonus" | "affiliate" | "earnings";
export type TransactionStatus = "initiated" | "pending" | "paid_unverified" | "success" | "failed";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

export interface WalletTransaction {
  _id: string;
  user: string;
  type: TransactionType;
  amount: number;
  source: TransactionSource;
  status: TransactionStatus;
  provider?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  _id: string;
  userId: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: string;
}

export interface WalletBalance {
  success: boolean;
  balance: number;
  withdrawable: number;
  pendingWithdrawals: number;
  lifetimeEarnings: number;
  lastWalletUpdate: string | null;
  pendingTopups: number;
}

/* ─── USER ─── */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  walletBalance: number;
  withdrawable: number;
  pendingWithdrawals: number;
  lifetimeEarnings: number;
  affiliateBalance: number;
  referralCode: string;
  interests: string[];
  country?: string;
  phone?: string;
  completedOnboarding: boolean;
  createdAt: string;
}

/* ─── WORKFORCE ─── */
export type WorkerStatus =
  | "applied" | "screening_unlocked" | "training_viewed" | "test_submitted"
  | "failed" | "ready_to_work" | "assigned" | "working"
  | "suspended" | "fresh" | "screening_available" | "inactive";

export type ProjectStatus = "draft" | "active" | "assigned" | "in_progress" | "submitted" | "completed";
export type ProjectType = "standard" | "rlhf_dataset";
export type DatasetType = "ranking" | "generation" | "red_team" | "fact_check" | "coding" | "multimodal";
export type ScreeningType = "mcq" | "written" | "mixed" | "coding" | "video" | "portfolio" | "live_test";

export interface ApplyWork {
  _id: string;
  userId: string | User;
  positionId?: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  workerStatus: WorkerStatus;
  screeningsCompleted: Array<{
    screeningId: string;
    score: number;
    passed: boolean;
    tier?: "bronze" | "silver" | "gold";
    reviewStatus?: string;
    completedAt: string;
  }>;
  assignedTasks: string[];
  tier: string;
  rlhfScore?: number;
  resumeUrl?: string;
  message?: string;
  trainingViewed?: boolean;
  createdAt: string;
}

export interface WorkPosition {
  _id: string;
  title: string;
  category: string;
  serviceId?: string;
  screeningId?: string;
  screeningIds?: string[];
  trainingMaterials?: Array<{ title: string; url: string; type: string }>;
  isActive?: boolean;
  createdAt: string;
}

export interface Project {
  _id: string;
  title: string;
  workPositionId?: string;
  category: string;
  payRate: number;
  payType: string;
  assignedTo?: string | User;
  status: ProjectStatus;
  projectType: ProjectType;
  datasetId?: string;
  createdAt: string;
}

export interface Dataset {
  _id: string;
  name: string;
  description?: string;
  datasetType: DatasetType;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  minJustificationWords: number;
  minWordCount?: number;
  allowMultiResponseComparison?: boolean;
  tasks?: DatasetTask[];
  taskCount?: number;
  completedTasks?: number;
  pendingReviews?: number;
  createdAt: string;
}

export interface DatasetTask {
  _id: string;
  datasetId: string;
  prompt: string;
  responseA?: string;
  responseB?: string;
  imageUrl?: string;
  correctAnswer?: string;
}

export interface RlhfSubmission {
  _id: string;
  projectId: string;
  datasetId: string;
  taskId: string;
  workerId: string | User;
  answerPayload: Record<string, unknown>;
  autoScore?: number;
  finalScore?: number;
  reviewStatus: "pending_review" | "approved" | "rejected";
  feedback?: string;
  createdAt: string;
}

export interface Screening {
  _id: string;
  title: string;
  category: string;
  screeningType: ScreeningType;
  questions: Array<{
    _id: string;
    questionText: string;
    questionType: string;
    options?: Array<{ text: string; isCorrect?: boolean }>;
    rubric?: string;
    maxScore?: number;
  }>;
  rubric?: string;
  evaluationMode?: string;
  isActive?: boolean;
  createdAt: string;
}

/* ─── TICKET ─── */
export type TicketCategory = "general" | "payment" | "order" | "kyc" | "rental" | "technical" | "affiliate" | "other";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "waiting_user" | "resolved" | "closed";

export interface Ticket {
  _id: string;
  userId: string | User;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  orderId?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  _id: string;
  ticketId: string;
  senderId: string;
  senderRole: "user" | "admin";
  message: string;
  attachments?: Array<{ url: string; filename: string; fileType: string }>;
  createdAt: string;
}

/* ─── BLOG ─── */
export interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  category: string;
  status: "draft" | "published";
  featuredImage?: string;
  relatedServices?: string[];
  tags?: string[];
  createdAt: string;
}

/* ─── NOTIFICATION ─── */
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

/* ─── PAYMENT METHOD ─── */
export interface PaymentMethod {
  _id: string;
  name: string;
  type: "paypal" | "crypto" | "binance" | "bank";
  details: string;
  instructions?: string;
  active: boolean;
}

/* ─── ORDER MESSAGE ─── */
export interface OrderMessage {
  _id: string;
  orderId: string;
  senderId: string;
  senderRole: "user" | "admin";
  message: string;
  attachments?: Array<{ url: string; filename: string; fileType: string; publicId?: string; size?: number }>;
  createdAt: string;
}

/* ─── PROOF OF WORK ─── */
export interface ProofOfWork {
  _id: string;
  projectId: string;
  workerId: string | User;
  submissionText: string;
  attachments?: Array<{ url: string; publicId?: string; filename?: string; type?: string }>;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  reviewedBy?: string;
  createdAt: string;
}

/* ─── FAQ ─── */
export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  isActive: boolean;
}

/* ─── SERVICE REQUEST ─── */
export interface ServiceRequest {
  _id: string;
  type?: string;
  requestedService: string;
  platform?: string;
  country?: string;
  urgency?: "asap" | "this_week" | "this_month" | "flexible";
  notes?: string;
  budget?: number;
  name?: string;
  email?: string;
  status?: string;
  createdAt: string;
}

/* ─── AFFILIATE ─── */
export interface AffiliateStats {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  balance: number;
  pendingWithdrawals: number;
}
