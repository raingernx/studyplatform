"use client";

import { useEffect, useId, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, useToast } from "@/design-system";
import { routes } from "@/lib/routes";

export interface CreatorAIDraftValues {
  resourceId: string;
  sourceText: string;
  sourceFileName?: string | null;
  subject?: string | null;
  grade?: string | null;
  language: string;
  quizCount: number;
  summary: string;
  learningOutcomes: string;
  quizDraft: string;
  generationMode: string;
}

export interface CreatorAIDraftResourceSeed {
  title: string;
  description: string;
  slug: string;
  type: "PDF" | "DOCUMENT";
  isFree: boolean;
  price: number;
  categoryId: string | null;
  fileUrl: string | null;
  previewUrls: string[];
}

interface CreatorAIDraftGeneratorProps {
  mode: "create" | "edit";
  resourceId?: string;
  initialDraft?: CreatorAIDraftValues | null;
  resourceSeed?: CreatorAIDraftResourceSeed;
  onApplySummary(summary: string): void;
}

type EditableDraftState = {
  sourceText: string;
  sourceFileName: string;
  subject: string;
  grade: string;
  language: string;
  quizCount: number;
  summary: string;
  learningOutcomes: string;
  quizDraft: string;
  generationMode: string;
};

const EMPTY_DRAFT_STATE: EditableDraftState = {
  sourceText: "",
  sourceFileName: "",
  subject: "",
  grade: "",
  language: "th",
  quizCount: 5,
  summary: "",
  learningOutcomes: "",
  quizDraft: "",
  generationMode: "HEURISTIC_V1",
};

function toDraftState(draft?: CreatorAIDraftValues | null): EditableDraftState {
  if (!draft) {
    return EMPTY_DRAFT_STATE;
  }

  return {
    sourceText: draft.sourceText,
    sourceFileName: draft.sourceFileName ?? "",
    subject: draft.subject ?? "",
    grade: draft.grade ?? "",
    language: "th",
    quizCount: draft.quizCount,
    summary: draft.summary,
    learningOutcomes: draft.learningOutcomes,
    quizDraft: draft.quizDraft,
    generationMode: draft.generationMode,
  };
}

export function CreatorAIDraftGenerator({
  mode,
  resourceId,
  initialDraft,
  resourceSeed,
  onApplySummary,
}: CreatorAIDraftGeneratorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputId = useId();
  const [draftState, setDraftState] = useState<EditableDraftState>(() => toDraftState(initialDraft));
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftState(toDraftState(initialDraft));
    setGenerateError(null);
    setSaveError(null);
  }, [initialDraft]);

  function handleTextChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setDraftState((current) => ({
      ...current,
      [name]: name === "quizCount" ? Number(value) || 5 : value,
    }));
  }

  async function handlePlainTextUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const allowedExtension = /\.(txt|md|markdown)$/i.test(file.name);
    const allowedMimeType =
      file.type.startsWith("text/") || file.type === "application/json" || file.type === "";

    if (!allowedExtension && !allowedMimeType) {
      setGenerateError("เวอร์ชันนี้รองรับไฟล์ข้อความ เช่น .txt หรือ .md เท่านั้น หรือวางเนื้อหาลงในช่องด้านล่าง");
      event.target.value = "";
      return;
    }

    if (file.size > 1_000_000) {
      setGenerateError("ไฟล์ข้อความต้องมีขนาดไม่เกิน 1 MB");
      event.target.value = "";
      return;
    }

    const text = await file.text();
    if (text.trim().length < 120) {
      setGenerateError("ไฟล์ที่อัปโหลดยังสั้นเกินไป กรุณาเพิ่มเนื้อหาให้ยาวอย่างน้อย 120 ตัวอักษร");
      event.target.value = "";
      return;
    }

    setDraftState((current) => ({
      ...current,
      sourceText: text.slice(0, 30_000),
      sourceFileName: file.name,
    }));
    setGenerateError(null);
    event.target.value = "";
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch("/api/creator/ai-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          sourceText: draftState.sourceText,
          sourceFileName: draftState.sourceFileName || null,
          subject: draftState.subject || null,
          grade: draftState.grade || null,
          language: "th",
          quizCount: draftState.quizCount,
          resourceSeed: mode === "create" ? resourceSeed : undefined,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to generate AI draft.");
      }

      const data = json.data as {
        resourceId: string;
        createdDraftResource: boolean;
        draft: CreatorAIDraftValues;
      };

      if (data.createdDraftResource && mode === "create") {
        toast.success("สร้างฉบับร่างด้วย AI แล้ว สามารถแก้ไขต่อในหน้าทรัพยากรฉบับร่างได้");
        router.push(routes.creatorResource(data.resourceId));
        router.refresh();
        return;
      }

      setDraftState(toDraftState(data.draft));
      toast.success("อัปเดต AI draft แล้ว");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "สร้าง AI draft ไม่สำเร็จ";
      setGenerateError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (!resourceId) {
      setSaveError("กรุณาสร้าง resource ฉบับร่างก่อน แล้วจึงบันทึกส่วนที่ AI สร้างให้");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/creator/ai-drafts/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: draftState.sourceText,
          sourceFileName: draftState.sourceFileName || null,
          subject: draftState.subject || null,
          grade: draftState.grade || null,
          language: "th",
          quizCount: draftState.quizCount,
          summary: draftState.summary,
          learningOutcomes: draftState.learningOutcomes,
          quizDraft: draftState.quizDraft,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to save AI draft.");
      }

      const data = json.data as {
        draft: CreatorAIDraftValues;
      };

      setDraftState(toDraftState(data.draft));
      toast.success("บันทึก AI draft แล้ว");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "บันทึก AI draft ไม่สำเร็จ";
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const canGenerate = draftState.sourceText.trim().length >= 120;
  const hasGeneratedDraft =
    draftState.summary.trim().length > 0 ||
    draftState.learningOutcomes.trim().length > 0 ||
    draftState.quizDraft.trim().length > 0;

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.18em] text-blue-600">ตัวช่วยสร้างฉบับร่างด้วย AI</p>
          <h2 className="text-lg font-semibold text-foreground">
            สร้างสรุปเนื้อหา ผลลัพธ์การเรียนรู้ และชุดคำถามเบื้องต้น
          </h2>
          <p className="text-sm text-muted-foreground">
            กรอกเฉพาะข้อมูลที่จำเป็น: วิชา ระดับชั้น จำนวนข้อ และเนื้อหาต้นฉบับ จากนั้น Krukraft จะสร้างฉบับร่างให้แก้ไขต่อได้ทันที
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-card px-3 py-2 text-xs text-muted-foreground">
          {mode === "create"
            ? "ครั้งแรกระบบจะสร้าง resource ฉบับร่างให้ก่อนอัตโนมัติ"
            : "ฟีเจอร์นี้ออกแบบมาสำหรับเนื้อหาภาษาไทยในเวอร์ชันแรก"}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">วิชา / หัวข้อ</label>
              <Input
                name="subject"
                value={draftState.subject}
                onChange={handleTextChange}
                placeholder="เช่น เศษส่วน หรือ การจับใจความ"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">ระดับชั้น</label>
              <Input
                name="grade"
                value={draftState.grade}
                onChange={handleTextChange}
                placeholder="เช่น ป.5 หรือ ม.1"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">จำนวนข้อคำถาม</label>
              <Input
                name="quizCount"
                type="number"
                min="3"
                max="10"
                value={String(draftState.quizCount)}
                onChange={handleTextChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-medium text-foreground" htmlFor={fileInputId}>
                อัปโหลดไฟล์ข้อความต้นฉบับ
              </label>
              <span className="text-xs text-muted-foreground">
                รองรับ `.txt`, `.md` หรือวางข้อความโดยตรง
              </span>
            </div>
            <input
              id={fileInputId}
              type="file"
              accept=".txt,.md,text/plain,text/markdown,application/json"
              onChange={handlePlainTextUpload}
              className="block w-full rounded-xl border border-dashed border-blue-300 bg-card px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            />
            {draftState.sourceFileName && (
              <p className="text-xs text-muted-foreground">
                ใช้ไฟล์: <span className="font-medium text-foreground">{draftState.sourceFileName}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">เนื้อหาต้นฉบับ</label>
            <Textarea
              name="sourceText"
              value={draftState.sourceText}
              onChange={handleTextChange}
              rows={10}
              placeholder="วางเนื้อหาการสอน คำอธิบายใบงาน คำสั่งกิจกรรม หรือบทสรุปบทเรียนที่ต้องการให้ AI นำไปสร้างฉบับร่าง"
              hint="อย่างน้อย 120 ตัวอักษร ระบบจะเก็บเนื้อหานี้เป็นฉบับร่างส่วนตัวเพื่อใช้สร้างใหม่ได้"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleGenerate} loading={generating} disabled={!canGenerate}>
              สร้างฉบับร่างด้วย AI
            </Button>
            <span className="text-xs text-muted-foreground">
              {canGenerate
                ? "หลังสร้างแล้ว คุณยังแก้ไขข้อความทุกส่วนได้เอง"
                : "เพิ่มเนื้อหาอีกเล็กน้อยก่อนเริ่มสร้างฉบับร่าง"}
            </span>
          </div>
          {generateError && <p className="text-sm text-red-600">{generateError}</p>}
        </div>
      </div>

      {hasGeneratedDraft && (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">ฉบับร่างที่ AI สร้างให้</h3>
                <p className="text-sm text-muted-foreground">
                  ตรวจและแก้ไขข้อความแต่ละส่วนก่อนบันทึกลงใน resource นี้
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onApplySummary(draftState.summary)}
                  disabled={!draftState.summary.trim()}
                >
                  ใช้สรุปนี้เป็นคำอธิบาย
                </Button>
                {resourceId && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveDraft}
                    loading={saving}
                  >
                    บันทึก AI draft
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">สรุปเนื้อหา</label>
                <Textarea
                  name="summary"
                  value={draftState.summary}
                  onChange={handleTextChange}
                  rows={5}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">ผลลัพธ์การเรียนรู้</label>
                <Textarea
                  name="learningOutcomes"
                  value={draftState.learningOutcomes}
                  onChange={handleTextChange}
                  rows={5}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">ชุดคำถามเบื้องต้น</label>
                <Textarea
                  name="quizDraft"
                  value={draftState.quizDraft}
                  onChange={handleTextChange}
                  rows={10}
                />
              </div>
            </div>
            {saveError && <p className="mt-4 text-sm text-red-600">{saveError}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
