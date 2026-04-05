import { FileText, Archive } from "lucide-react";

export interface ResourceFileItem {
  /** Display name, e.g. "worksheet.pdf" */
  name: string;
  /** Size in bytes; optional, shown when present */
  size?: number | null;
}

function formatFileSize(bytes: number): string {
  if (bytes > 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

function getFileIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".zip") || lower.endsWith(".rar") || lower.endsWith(".7z")) {
    return <Archive className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
  return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

interface ResourceFilesProps {
  /** List of included files (name and optional size). */
  files: ResourceFileItem[];
}

export function ResourceFiles({ files }: ResourceFilesProps) {
  if (files.length === 0) {
    return (
      <section id="included" className="space-y-4 border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Included files</h2>
        <div className="rounded-xl border border-border bg-muted px-4 py-4">
          <p className="text-small leading-6 text-muted-foreground">
            File details for this resource will appear here once the creator uploads the final
            asset.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="included" className="space-y-4 border-t border-border pt-6">
      <h2 className="font-display text-lg font-semibold text-foreground">Included files</h2>
      <ul className="divide-y divide-border rounded-xl border border-border bg-muted">
        {files.map((file, i) => (
          <li
            key={file.name + (file.size ?? "") + i}
            className="flex items-center justify-between gap-4 px-4 py-3 first:rounded-t-xl last:rounded-b-xl"
          >
            <span className="flex items-center gap-3 min-w-0">
              {getFileIcon(file.name)}
              <span className="text-small font-medium text-foreground truncate">{file.name}</span>
            </span>
            {file.size != null && (
              <span className="shrink-0 text-small text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
