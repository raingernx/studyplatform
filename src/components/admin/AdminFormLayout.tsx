/**
 * Global admin form layout: FORM | SIDEBAR.
 * Used by Create Resource and Edit Resource pages.
 *
 * Desktop (xl): two columns — form (fluid) | sidebar (380px).
 * Mobile / Tablet: single column — form then sidebar stacked.
 *
 * Design: Clean SaaS admin (Stripe / Linear / Vercel style).
 * Identical layout for Create and Edit; only sidebar content differs
 * (Edit adds Stats + Details cards).
 */
interface AdminFormLayoutProps {
  form: React.ReactNode;
  sidebar: React.ReactNode;
}

export function AdminFormLayout({ form, sidebar }: AdminFormLayoutProps) {
  return (
    <div className="grid w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-8">
        {form}
      </div>
      <aside className="min-w-0 space-y-6">
        {sidebar}
      </aside>
    </div>
  );
}
