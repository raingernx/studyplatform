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
    return <Archive className="h-4 w-4 shrink-0 text-zinc-500" />;
  }
  return <FileText className="h-4 w-4 shrink-0 text-zinc-500" />;
}

interface ResourceFilesProps {
  /** List of included files (name and optional size). */
  files: ResourceFileItem[];
}

export function ResourceFiles({ files }: ResourceFilesProps) {
  if (files.length === 0) {
    return (
      <section id="included">
        <h2 className="font-display text-lg font-semibold text-zinc-900">Included files</h2>
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-4 py-4">
          <p className="text-[13px] text-zinc-500">
            File details for this resource will appear here once the creator uploads the final
            asset.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="included">
      <h2 className="font-display text-lg font-semibold text-zinc-900">Included files</h2>
      <ul className="mt-3 rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
        {files.map((file, i) => (
          <li
            key={file.name + (file.size ?? "") + i}
            className="flex items-center justify-between gap-4 px-4 py-3 first:rounded-t-xl last:rounded-b-xl"
          >
            <span className="flex items-center gap-3 min-w-0">
              {getFileIcon(file.name)}
              <span className="text-[13px] font-medium text-zinc-900 truncate">{file.name}</span>
            </span>
            {file.size != null && (
              <span className="text-[13px] text-zinc-500 shrink-0">
                {formatFileSize(file.size)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
