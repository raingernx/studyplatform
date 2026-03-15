import { Label } from "@/components/admin/ResourceForm";
import { Textarea } from "@/components/ui/forms";
import type { ResourceFormValues } from "./types/resource-form";

interface ResourceBasicFieldsProps {
  form: ResourceFormValues;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export function ResourceBasicFields({ form, onChange }: ResourceBasicFieldsProps) {
  return (
    <div className="grid w-full min-w-0 gap-4">
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={3}
          value={form.title}
          onChange={onChange}
          className="input-base w-full"
        />
      </div>

      <div className="min-w-0 space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={10}
          value={form.description}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

