import { z } from "zod";

// Bangladeshi mobile numbers: 01[3-9]XXXXXXXX (11 digits total)
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number (e.g. 01712345678)");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const nameSchema = z.string().trim().min(2, "Name is too short").max(100);

export const otpCodeSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

export const signupSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
  purpose: z.enum(["SIGNUP", "RESET_PASSWORD"]),
});

export const setPasswordSchema = z
  .object({
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  phone: phoneSchema,
});

export const paymentSubmissionSchema = z
  .object({
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    method: z.enum(["CASH", "BKASH", "NAGAD"]),
    transactionId: z.string().trim().max(100).optional(),
  })
  .refine((data) => data.method === "CASH" || !!data.transactionId, {
    message: "Transaction ID is required for bKash and Nagad payments",
    path: ["transactionId"],
  });
