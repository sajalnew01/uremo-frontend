/**
 * PATCH_63: MASTER ADMIN REBUILD
 * Export all v2 admin components
 */

export { default as CommandRail } from "./CommandRail";
export { default as ContextBar } from "./ContextBar";
export { default as InspectorDrawer, InspectorSection, InspectorField } from "./InspectorDrawer";
export { default as AdminLayoutV2, useAdminContext } from "./AdminLayoutV2";
export { default as ActionQueuePage } from "./ActionQueuePage";

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
