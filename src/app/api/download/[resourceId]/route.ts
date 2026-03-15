import { handleResourceDownload } from "@/services/purchases/download.service";

type RouteContext = {
  params: Promise<{ resourceId: string }>;
};

export async function GET(req: Request, { params }: RouteContext) {
  const { resourceId } = await params;
  return handleResourceDownload(req, resourceId);
}
