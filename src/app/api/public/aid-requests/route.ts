import { NextResponse } from "next/server";
import { getPrisma } from "@/src/backend/config/db";
import { z } from "zod";
import { validateStructuredPhone } from "@/src/backend/utils/phone";

const AidRequestSchema = z.object({
  patientName: z.string().min(1),
  hospitalName: z.string().min(1),
  amountRequired: z.union([z.string(), z.number()]),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1),
  phoneData: z.object({
    country_name: z.string().min(1),
    country_code: z.string().length(2),
    dial_code: z.string().regex(/^\+\d+$/),
    local_phone_number: z.string().regex(/^\d+$/),
    full_phone_number: z.string().regex(/^\+\d+$/),
  }).optional(),
  medicalNote: z.string().min(1),
  prescriptionUrl: z.string().url().optional(),
  reportUrl: z.string().url().optional(),
  prescriptionUrls: z.array(z.string().url()).optional(),
  reportUrls: z.array(z.string().url()).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = AidRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid or missing request fields." }, { status: 400 });
    }

    const {
      patientName,
      hospitalName,
      amountRequired,
      email,
      phone,
      phoneData,
      medicalNote,
      prescriptionUrl,
      reportUrl,
      prescriptionUrls,
      reportUrls,
    } = parsed.data;
    const numericAmount = typeof amountRequired === "number" ? amountRequired : parseFloat(amountRequired);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ success: false, message: "Amount must be a valid positive number." }, { status: 400 });
    }
    const phoneValidation = phoneData ? validateStructuredPhone(phoneData) : null;
    if (phoneData && !phoneValidation?.ok) {
      return NextResponse.json({ success: false, message: phoneValidation.error }, { status: 400 });
    }
    const normalizedPhone = phoneValidation?.ok ? phoneValidation.normalized.full_phone_number : phone;

    const normalizedPrescriptionUrls =
      prescriptionUrls && prescriptionUrls.length > 0
        ? prescriptionUrls
        : prescriptionUrl
          ? [prescriptionUrl]
          : [];
    const normalizedReportUrls =
      reportUrls && reportUrls.length > 0
        ? reportUrls
        : reportUrl
          ? [reportUrl]
          : [];

    const aidRequest = await getPrisma().medicalAidRequest.create({
      data: {
        patient_name: patientName,
        hospital_name: hospitalName,
        amount_required: numericAmount,
        email: email || "",
        phone: normalizedPhone,
        ...(phoneValidation?.ok && {
          phone_country_name: phoneValidation.normalized.country_name,
          phone_country_code: phoneValidation.normalized.country_code,
          phone_dial_code: phoneValidation.normalized.dial_code,
          phone_local_number: phoneValidation.normalized.local_phone_number,
          phone_full_number: phoneValidation.normalized.full_phone_number,
        }),
        medical_note: medicalNote,
        prescription_url:
          normalizedPrescriptionUrls.length > 1
            ? JSON.stringify(normalizedPrescriptionUrls)
            : normalizedPrescriptionUrls[0],
        report_url:
          normalizedReportUrls.length > 1
            ? JSON.stringify(normalizedReportUrls)
            : normalizedReportUrls[0],
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, data: aidRequest, message: "Medical Aid Application Submitted successfully." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to submit medical aid request." }, { status: 500 });
  }
}
