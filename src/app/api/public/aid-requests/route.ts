import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientName, hospitalName, amountRequired, email, phone, medicalNote } = body;

    // Validate essential inputs
    if (!patientName || !hospitalName || !amountRequired || !phone) {
      return NextResponse.json({ success: false, message: "Missing required patient details." }, { status: 400 });
    }

    // In a real application, image URLs would be handled by a storage bucket (S3, Vercel Blob) and parsed here
    const aidRequest = await prisma.medicalAidRequest.create({
      data: {
        patient_name: patientName,
        hospital_name: hospitalName,
        amount_required: parseFloat(amountRequired),
        email: email || "",
        phone: phone,
        medical_note: medicalNote,
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, data: aidRequest, message: "Medical Aid Application Submitted successfully." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to submit medical aid request." }, { status: 500 });
  }
}
