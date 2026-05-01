import { NextResponse } from "next/server";
import { getPrisma } from "@/src/backend/config/db";
import { getPublicFaqs } from "@/src/backend/services/faqService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getPublicFaqs(getPrisma());
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load FAQ content." }, { status: 500 });
  }
}
