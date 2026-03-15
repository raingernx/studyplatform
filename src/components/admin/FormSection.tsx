import { FormSection as FormSectionDesignSystem } from "@/components/ui/forms";

interface FormSectionProps {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="w-full min-w-0 space-y-4">
      <FormSectionDesignSystem title={title} description={description}>
        {children}
      </FormSectionDesignSystem>
    </section>
  );
}
