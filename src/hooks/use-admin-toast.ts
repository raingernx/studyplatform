/**
 * Admin notifications — use this hook in admin pages for consistent toast usage.
 *
 * Types: success | error | warning | info
 *
 * Usage:
 *   const { toast } = useAdminToast();
 *   toast.success("Resource published");
 *   toast.error("Failed to save");
 *   toast.warning("Some items were skipped");
 *   toast.info("No changes to apply");
 */
export { useToast as useAdminToast } from "@/hooks/use-toast";
