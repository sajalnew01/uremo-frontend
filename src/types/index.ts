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
  | "topup" | "service_purchase" | "rental_purchase"
  | "admin_adjustment" | "refund" | "earning"
  | "withdrawal_request" | "withdrawal_completed" | "rental_payment";
export type TransactionStatus = "initiated" | "pending" | "paid_unverified" | "success" | "failed";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

export interface WalletTransaction {
  _id: string;
  user: string | { _id: string; name: string; email: string };
  type: TransactionType;
  amount: number;
  source: TransactionSource;
  status: TransactionStatus;
  provider?: string;
  providerRef?: string | null;
  referenceId?: string | null;
  description?: string;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface WithdrawalRequest {
  _id: string;
  userId: string | { _id: string; name: string; email: string; walletBalance?: number; withdrawable?: number; pendingWithdrawals?: number };
  amount: number;
  status: WithdrawalStatus;
  requestedAt?: string;
  reviewedAt?: string | null;
  reviewedBy?: string | { _id: string; name: string; email: string } | null;
  adminNote?: string;
  transactionId?: string | null;
  completionTransactionId?: string | null;
  createdAt: string;
  updatedAt?: string;
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

export type ProjectStatus = "draft" | "open" | "assigned" | "in_progress" | "completed" | "cancelled";
export type ProjectType = "standard" | "rlhf_dataset";
export type DatasetType = "ranking" | "generation" | "red_team" | "fact_check" | "coding" | "multimodal";
export type ScreeningType = "mcq" | "written" | "ranking" | "red_team" | "fact_check" | "coding" | "multimodal";
export type ScreeningCategory = "microjobs" | "writing" | "teaching" | "coding_math" | "outlier" | "other";
export type SubmissionStatus = "auto_graded" | "pending_review" | "approved" | "rejected";

export interface ApplyWork {
  _id: string;
  user: string | User;
  position: string | WorkPosition;
  positionTitle: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  workerStatus: WorkerStatus;
  resumeUrl?: string;
  message?: string;
  trainingViewedAt?: string;
  attemptCount: number;
  maxAttempts: number;
  screeningsCompleted: Array<{
    screeningId: string;
    completedAt: string;
    score: number;
    passed: boolean;
    autoScore?: number;
    autoPass?: boolean;
    submissionStatus: SubmissionStatus;
    rubricBreakdown?: Array<{ criteria: string; weight: number; maxScore: number; awarded: number }>;
    validationFlags?: Array<{ rule: string; passed: boolean; detail: string }>;
    adminReviewedBy?: string;
    adminReviewedAt?: string;
    adminScore?: number;
    answers?: Record<string, unknown>;
  }>;
  currentProject?: string;
  projectsCompleted?: Array<{ projectId: string; completedAt: string; rating: number; earnings: number }>;
  totalEarnings: number;
  pendingEarnings: number;
  payRate: number;
  assignedTasks: Array<{
    _id: string;
    description: string;
    assignedAt: string;
    status: "pending" | "in-progress" | "completed";
    assignedBy?: string;
    completedAt?: string;
    notes?: string;
  }>;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  qualityScore: number;
  tier: "bronze" | "silver" | "gold" | "elite";
  rlhfScore: number;
  totalAnnotations: number;
  approvalRate: number;
  justificationQualityScore: number;
  createdAt: string;
}

export interface WorkPosition {
  _id: string;
  title: string;
  category: string;
  description?: string;
  requirements?: string;
  serviceId?: string;
  hasScreening: boolean;
  screeningId?: string;
  screeningIds?: string[];
  trainingMaterials?: Array<{ title: string; type: "link" | "pdf" | "video"; url: string; description?: string }>;
  adminNotes?: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Project {
  _id: string;
  title: string;
  description?: string;
  workPositionId?: string | WorkPosition;
  category: string;
  instructions?: string;
  deliverables?: Array<{ title: string; description?: string; required?: boolean }>;
  payRate: number;
  payType: "per_task" | "hourly" | "fixed";
  estimatedTasks: number;
  assignedTo?: string | User;
  assignedAt?: string;
  screeningId?: string;
  screeningIds?: string[];
  status: ProjectStatus;
  projectType: ProjectType;
  completedAt?: string;
  completionNotes?: string;
  adminRating?: number;
  earningsCredited: number;
  creditedAt?: string;
  deadline?: string;
  datasetId?: string;
  rewardPerTask: number;
  createdBy?: string;
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
  description?: string;
  category: ScreeningCategory;
  screeningType: ScreeningType;
  minJustificationWords: number;
  allowRanking?: boolean;
  allowMultiResponseComparison?: boolean;
  trainingMaterials?: Array<{ title: string; type: string; url: string; description?: string }>;
  questions: Array<{
    _id: string;
    question: string;
    type: "single" | "multi" | "multiple_choice" | "text" | "file_upload" | "ranking" | "written" | "red_team" | "fact_check" | "coding" | "multimodal";
    options?: string[];
    correctAnswer?: string;
    correctAnswers?: string[];
    points?: number;
    responseA?: string;
    responseB?: string;
    imageUrl?: string;
    codeLanguage?: string;
    referenceUrls?: string[];
    minWords?: number;
  }>;
  passingScore: number;
  timeLimit: number;
  evaluationMode: "manual" | "auto" | "hybrid";
  rubric?: Array<{ criteria: string; weight: number; maxScore: number }>;
  passThreshold: number;
  autoValidationRules?: {
    minWords?: number;
    maxWords?: number;
    requiredFields?: string[];
    bannedWords?: string[];
    requireJustification?: boolean;
  };
  active: boolean;
  createdBy?: string;
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
