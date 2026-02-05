// PATCH_60: Workforce Components Index
export { default as WorkerPipelineCard } from "./WorkerPipelineCard";
export { default as WorkerPipelineBoard } from "./WorkerPipelineBoard";
export { default as WorkerTimelineModal } from "./WorkerTimelineModal";
export { default as WorkerActionPanel } from "./WorkerActionPanel";
export { default as PendingActionQueue } from "./PendingActionQueue";

// PATCH-65: Enhanced visibility components
export { default as WorkerLifecycleTimeline } from "./WorkerLifecycleTimeline";
export { default as WorkerRiskIndicators, WorkerRiskBadges } from "./WorkerRiskIndicators";
export { default as StateAwareActionPanel, getActionTransitionInfo } from "./StateAwareActionPanel";

// PATCH-65.1: Project lifecycle clarity components
export { default as ActiveProjectCard, ActiveProjectBadge } from "./ActiveProjectCard";
export { default as ProjectCompletionConfirmation, CompletionStatusBadge, deriveCompletionData } from "./ProjectCompletionConfirmation";

// Re-export types
export type { WorkerData } from "./WorkerPipelineCard";
export type {
  PendingApplication,
  PendingScreening,
  PendingProof,
  PendingCredit,
} from "./PendingActionQueue";
