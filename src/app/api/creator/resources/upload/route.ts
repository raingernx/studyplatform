import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";
import { CreatorServiceError } from "@/services/creator";
import {
  CreatorResourceUploadServiceError,
  uploadCreatorResourceFile,
} from "@/services/resources/mutations";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(LIMITS.upload, ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: "มีคำขออัปโหลดมากเกินไป กรุณาลองใหม่อีกครั้งในอีกสักครู่" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
            "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          },
        },
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนใช้งาน" }, { status: 401 });
    }

    const formData = await req.formData();
    const resourceId = formData.get("resourceId");
    const file = formData.get("file");

    const uploaded = await uploadCreatorResourceFile({
      resourceId,
      file,
      userId: session.user.id,
    });

    return NextResponse.json(uploaded);
  } catch (error) {
    if (error instanceof CreatorServiceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }

    if (error instanceof CreatorResourceUploadServiceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }

    console.error("[CREATOR_RESOURCE_UPLOAD_POST]", error);
    return NextResponse.json(
      { error: "อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }
}
