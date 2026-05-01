import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/src/backend/config/db";
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from "@/src/backend/utils/session";
import { getAllFaqs } from "@/src/backend/services/faqService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UpdateFaqSchema = z.object({
  question: z.string().trim().min(8).max(300),
  answer: z.string().trim().min(12).max(5000),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.coerce.boolean(),
});

const ensureAdmin = (req: Request) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const };
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = ensureAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const parsed = UpdateFaqSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid FAQ payload.", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    await prisma.faqItem.update({
      where: { id },
      data: {
        question: parsed.data.question,
        answer: parsed.data.answer,
        sort_order: parsed.data.sortOrder,
        is_active: parsed.data.isActive,
      },
    });

    const data = await getAllFaqs(prisma);
    return NextResponse.json({ success: true, data, message: "FAQ updated." });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update FAQ item." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = ensureAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const prisma = getPrisma();
    await prisma.faqItem.delete({ where: { id } });
    const data = await getAllFaqs(prisma);
    return NextResponse.json({ success: true, data, message: "FAQ deleted." });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to delete FAQ item." }, { status: 500 });
  }
}
