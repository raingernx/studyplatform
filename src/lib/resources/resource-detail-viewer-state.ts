export interface ResourceDetailViewerReview {
  rating: number;
  body: string | null;
}

export type ResourceDetailViewerScope = "base" | "review";

export interface ResourceDetailViewerBaseState {
  authenticated: boolean;
  userId: string | null;
  subscriptionStatus: string | null;
  isOwned: boolean;
}
