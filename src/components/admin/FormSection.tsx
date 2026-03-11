interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="w-full min-w-0 space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">
          {title}
        </h3>
      </header>
      <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </section>
  );
}
