"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { UploadItem, UploadStatus } from "@/features/admin-ux/types";


interface UploadManagerContextValue {
  uploads: UploadItem[];
  beginUpload: (fileName: string) => string;
  updateProgress: (id: string, progress: number) => void;
  updateStatus: (id: string, status: UploadStatus) => void;
  clearCompleted: () => void;
}

const UploadManagerContext =
  createContext<UploadManagerContextValue | undefined>(undefined);

let uploadIdCounter = 0;

export function UploadManagerProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const beginUpload = useCallback((fileName: string) => {
    const id = `upload_${++uploadIdCounter}`;
    setUploads((prev) => [
      ...prev,
      { id, fileName, progress: 0, status: "pending" },
    ]);
    return id;
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              progress,
              status: progress >= 100 ? "completed" : "uploading",
            }
          : u,
      ),
    );
  }, []);

  const updateStatus = useCallback((id: string, status: UploadStatus) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              status,
              progress: status === "completed" ? 100 : u.progress,
            }
          : u,
      ),
    );
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status !== "completed"));
  }, []);

  const value = useMemo<UploadManagerContextValue>(
    () => ({
      uploads,
      beginUpload,
      updateProgress,
      updateStatus,
      clearCompleted,
    }),
    [uploads, beginUpload, updateProgress, updateStatus, clearCompleted],
  );

  return (
    <UploadManagerContext.Provider value={value}>
      {children}
    </UploadManagerContext.Provider>
  );
}

export function useUploadManager(): UploadManagerContextValue {
  const ctx = useContext(UploadManagerContext);
  if (!ctx) {
    throw new Error("useUploadManager must be used within an UploadManagerProvider");
  }
  return ctx;
}

