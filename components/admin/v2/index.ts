/**
 * PATCH_63: MASTER ADMIN REBUILD
 * PATCH_66: UX Safety Layer Components
 * Export all v2 admin components
 */

export { default as CommandRail } from "./CommandRail";
export { default as ContextBar } from "./ContextBar";
export { default as InspectorDrawer, InspectorSection, InspectorField } from "./InspectorDrawer";
export { default as AdminLayoutV2, useAdminContext } from "./AdminLayoutV2";
export { default as ActionQueuePage } from "./ActionQueuePage";

// PATCH_66: UX Safety Layer
export { default as ConfirmModal } from "./ConfirmModal";
export { default as UndoToast, useUndoToast } from "./UndoToast";
export { default as AuditTrail, parseActivityLog } from "./AuditTrail";
export { default as ActionBar } from "./ActionBar";
export { default as StatusTooltip } from "./StatusTooltip";
export { default as NextStepPanel, getWorkerNextStep } from "./NextStepPanel";

// UI Kit exports
export {
  DataTable,
  StatusBadge,
  ActionButton,
  StatCard,
  FilterBar,
  SectionHeader,
  Card,
  EmptyState,
  Timeline,
  WarningBanner,
} from "./AdminUIKit";
