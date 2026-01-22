/**
 * PATCH_18: Custom events for real-time UI updates
 * 
 * Usage:
 *   import { emitServicesRefresh, onServicesRefresh } from '@/lib/events';
 *   
 *   // Emit after admin creates/updates/deletes a service
 *   emitServicesRefresh();
 *   
 *   // Listen in buy-service page to refresh data
 *   useEffect(() => onServicesRefresh(() => refetch()), []);
 */

// Event names
export const EVENTS = {
  SERVICES_REFRESH: 'services:refresh',
  ORDERS_REFRESH: 'orders:refresh',
} as const;

/**
 * Emit a custom window event to signal that services have been updated
 */
export function emitServicesRefresh(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENTS.SERVICES_REFRESH));
  }
}

/**
 * Subscribe to services refresh events
 * @returns cleanup function to remove listener
 */
export function onServicesRefresh(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  window.addEventListener(EVENTS.SERVICES_REFRESH, callback);
  return () => window.removeEventListener(EVENTS.SERVICES_REFRESH, callback);
}

/**
 * Emit a custom window event to signal that orders have been updated
 */
export function emitOrdersRefresh(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENTS.ORDERS_REFRESH));
  }
}

/**
 * Subscribe to orders refresh events
 * @returns cleanup function to remove listener
 */
export function onOrdersRefresh(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  window.addEventListener(EVENTS.ORDERS_REFRESH, callback);
  return () => window.removeEventListener(EVENTS.ORDERS_REFRESH, callback);
}
