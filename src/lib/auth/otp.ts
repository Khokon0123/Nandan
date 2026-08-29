import { prisma } from "@/lib/db";
import type { OtpPurpose } from "@prisma/client";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueOtp(phone: string, purpose: OtpPurpose) {
  const recent = await prisma.otpCode.findFirst({
    where: { phone, purpose, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitMs = RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime());
    return { code: null, waitSeconds: Math.ceil(waitMs / 1000) };
  }

  const code = generateCode();
  await prisma.otpCode.create({
    data: {
      phone,
      code,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  return { code, waitSeconds: 0 };
}

export async function verifyOtp(phone: string, code: string, purpose: OtpPurpose) {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, purpose, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { ok: false as const, reason: "No verification code found. Request a new one." };
  if (otp.expiresAt < new Date()) return { ok: false as const, reason: "Code has expired. Request a new one." };
  if (otp.code !== code) return { ok: false as const, reason: "Incorrect code." };

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });
  return { ok: true as const };
}
