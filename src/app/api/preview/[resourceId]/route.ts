import { handleResourcePreview } from "@/services/resources/preview.service";

type RouteContext = {
  params: Promise<{ resourceId: string }>;
};

export async function GET(req: Request, { params }: RouteContext) {
  const { resourceId } = await params;
  return handleResourcePreview(req, resourceId);
}
