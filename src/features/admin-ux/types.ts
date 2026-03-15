export type UndoAction = {
  id: string;
  label: string;
  entityType?: string;
  entityId?: string;
  expiresAt: number;
};

export type BackgroundJobStatus = "pending" | "running" | "completed" | "failed";

export type BackgroundJob = {
  id: string;
  label: string;
  status: BackgroundJobStatus;
  meta?: Record<string, unknown>;
};

export type UploadStatus = "pending" | "uploading" | "completed" | "failed";

export type UploadItem = {
  id: string;
  fileName: string;
  progress: number;
  status: UploadStatus;
};

export type NotificationType = "success" | "info" | "warning" | "error";

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  description?: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export type ActivityEntry = {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
  meta?: Record<string, unknown>;
};

