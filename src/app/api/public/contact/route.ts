import { NextResponse } from "next/server";
import { z } from "zod";
import { transporter } from "@/src/backend/utils/mailer";
import { getAppEnv } from "@/src/backend/config/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CONTACT_RECEIVER = "x.shurov@gmail.com";
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_PER_IP = 5;
const RATE_LIMIT_PER_EMAIL = 3;

const ipHits = new Map<string, number[]>();
const emailHits = new Map<string, number[]>();

const ContactSchema = z.object({
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(2000),
  website: z.string().optional().default(""), // honeypot
});

const hasLink = (text: string) => /(https?:\/\/|www\.|<a\s+href=)/i.test(text);
const hasSuspiciousSqlPattern = (text: string) =>
  /(\bunion\b\s+\bselect\b|\bdrop\b\s+\btable\b|\binsert\b\s+\binto\b|\bdelete\b\s+\bfrom\b|--|;|\bor\b\s+1=1|\bselect\b.+\bfrom\b)/i.test(
    text,
  );
const hasSpamPattern = (text: string) =>
  /(crypto|bitcoin|forex|casino|loan|telegram\s*@|whatsapp\s*\+?\d{5,}|buy\s+now|free\s+money)/i.test(text);

const getClientIp = (req: Request) => {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const cfip = req.headers.get("cf-connecting-ip");
  if (cfip) return cfip.trim();
  return "unknown";
};

const enforceRateLimit = (bucket: Map<string, number[]>, key: string, maxHits: number) => {
  const now = Date.now();
  const current = (bucket.get(key) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (current.length >= maxHits) {
    bucket.set(key, current);
    return false;
  }
  current.push(now);
  bucket.set(key, current);
  return true;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid contact form payload." }, { status: 400 });
    }

    const { email, message, website } = parsed.data;
    const ip = getClientIp(req);

    if (website.trim().length > 0) {
      return NextResponse.json({ success: true, message: "Message received." });
    }

    if (!enforceRateLimit(ipHits, ip, RATE_LIMIT_PER_IP) || !enforceRateLimit(emailHits, email.toLowerCase(), RATE_LIMIT_PER_EMAIL)) {
      return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 });
    }

    if (hasLink(message)) {
      return NextResponse.json({ success: false, message: "Links are not allowed in contact messages." }, { status: 400 });
    }

    if (hasSuspiciousSqlPattern(message) || hasSuspiciousSqlPattern(email) || hasSpamPattern(message)) {
      return NextResponse.json({ success: false, message: "Message rejected by security filters." }, { status: 400 });
    }

    const env = getAppEnv();
    await transporter.sendMail({
      from: `"BloodNet Contact" <${env.SMTP_USER}>`,
      to: CONTACT_RECEIVER,
      replyTo: email,
      subject: "BloodNet Contact Form Submission",
      text: `From: ${email}\nIP: ${ip}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;padding:16px;border:1px solid #eee;border-radius:10px;">
          <h2 style="margin:0 0 12px;color:#C1121F;">New Contact Submission</h2>
          <p style="margin:0 0 8px;"><strong>From:</strong> ${email}</p>
          <p style="margin:0 0 16px;"><strong>IP:</strong> ${ip}</p>
          <div style="padding:12px;background:#f8fafc;border-radius:8px;white-space:pre-wrap;line-height:1.5;">${message}</div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Message sent successfully." });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to send message right now." }, { status: 500 });
  }
}
