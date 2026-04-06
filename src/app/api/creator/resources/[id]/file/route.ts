import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreatorServiceError } from "@/services/creator";
import {
  CreatorResourceUploadServiceError,
  clearCreatorResourceFile,
} from "@/services/resources/mutations";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนใช้งาน" }, { status: 401 });
    }

    const { id } = await params;
    await clearCreatorResourceFile(session.user.id, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof CreatorServiceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }

    if (error instanceof CreatorResourceUploadServiceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }

    console.error("[CREATOR_RESOURCE_FILE_DELETE]", error);
    return NextResponse.json(
      { error: "ลบไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }
}
