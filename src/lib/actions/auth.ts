"use server";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { issueOtp, verifyOtp } from "@/lib/auth/otp";
import { createSession, destroySession } from "@/lib/auth/session";
import { sendOtp } from "@/lib/sms";
import {
  signupSchema,
  verifyOtpSchema,
  setPasswordSchema,
  loginSchema,
  forgotPasswordSchema,
} from "@/lib/validation";
import { redirect } from "next/navigation";

export type ActionResult = { ok: true } | { ok: false; error: string };

const RECENT_VERIFICATION_WINDOW_MS = 15 * 60 * 1000;

export async function requestSignupOtp(input: { name: string; phone: string }): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { phone } = parsed.data;

  const existing = await prisma.volunteer.findUnique({ where: { phone } });
  if (existing) {
    return { ok: false, error: "This phone number is already registered. Try logging in instead." };
  }

  const { code, waitSeconds } = await issueOtp(phone, "SIGNUP");
  if (!code) {
    return { ok: false, error: `Please wait ${waitSeconds}s before requesting another code.` };
  }
  await sendOtp(phone, code);
  return { ok: true };
}

export async function verifySignupOtp(input: { phone: string; code: string }): Promise<ActionResult> {
  const parsed = verifyOtpSchema.safeParse({ ...input, purpose: "SIGNUP" });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const result = await verifyOtp(parsed.data.phone, parsed.data.code, "SIGNUP");
  if (!result.ok) return { ok: false, error: result.reason };
  return { ok: true };
}

export async function completeSignup(input: {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const parsed = setPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const name = input.name?.trim();
  if (!name || name.length < 2) {
    return { ok: false, error: "Name is too short" };
  }
  const { phone, password } = parsed.data;

  const recentVerification = await prisma.otpCode.findFirst({
    where: {
      phone,
      purpose: "SIGNUP",
      consumed: true,
      createdAt: { gte: new Date(Date.now() - RECENT_VERIFICATION_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!recentVerification) {
    return { ok: false, error: "Please verify your phone number again before continuing." };
  }

  const existing = await prisma.volunteer.findUnique({ where: { phone } });
  if (existing) {
    return { ok: false, error: "This phone number is already registered. Try logging in instead." };
  }

  const passwordHash = await hashPassword(password);
  const volunteer = await prisma.volunteer.create({
    data: { name, phone, passwordHash, phoneVerified: true },
  });

  await createSession({ volunteerId: volunteer.id, isAdmin: volunteer.isAdmin });
  redirect("/dashboard");
}

export async function login(input: { phone: string; password: string }): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { phone, password } = parsed.data;

  const volunteer = await prisma.volunteer.findUnique({ where: { phone } });
  if (!volunteer || !volunteer.phoneVerified) {
    return { ok: false, error: "Invalid phone number or password" };
  }

  const valid = await verifyPassword(password, volunteer.passwordHash);
  if (!valid) {
    return { ok: false, error: "Invalid phone number or password" };
  }

  await createSession({ volunteerId: volunteer.id, isAdmin: volunteer.isAdmin });
  redirect(volunteer.isAdmin ? "/admin" : "/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function requestPasswordResetOtp(input: { phone: string }): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { phone } = parsed.data;

  const volunteer = await prisma.volunteer.findUnique({ where: { phone } });
  if (!volunteer) {
    // Avoid revealing whether a phone number is registered.
    return { ok: true };
  }

  const { code, waitSeconds } = await issueOtp(phone, "RESET_PASSWORD");
  if (!code) {
    return { ok: false, error: `Please wait ${waitSeconds}s before requesting another code.` };
  }
  await sendOtp(phone, code);
  return { ok: true };
}

export async function verifyPasswordResetOtp(input: { phone: string; code: string }): Promise<ActionResult> {
  const parsed = verifyOtpSchema.safeParse({ ...input, purpose: "RESET_PASSWORD" });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const result = await verifyOtp(parsed.data.phone, parsed.data.code, "RESET_PASSWORD");
  if (!result.ok) return { ok: false, error: result.reason };
  return { ok: true };
}

export async function completePasswordReset(input: {
  phone: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const parsed = setPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { phone, password } = parsed.data;

  const recentVerification = await prisma.otpCode.findFirst({
    where: {
      phone,
      purpose: "RESET_PASSWORD",
      consumed: true,
      createdAt: { gte: new Date(Date.now() - RECENT_VERIFICATION_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!recentVerification) {
    return { ok: false, error: "Please verify your phone number again before continuing." };
  }

  const volunteer = await prisma.volunteer.findUnique({ where: { phone } });
  if (!volunteer) {
    return { ok: false, error: "No account found for this phone number." };
  }

  const passwordHash = await hashPassword(password);
  await prisma.volunteer.update({ where: { id: volunteer.id }, data: { passwordHash } });

  await createSession({ volunteerId: volunteer.id, isAdmin: volunteer.isAdmin });
  redirect(volunteer.isAdmin ? "/admin" : "/dashboard");
}
