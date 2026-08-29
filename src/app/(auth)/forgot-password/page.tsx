"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  completePasswordReset,
} from "@/lib/actions/auth";
import { StepDots } from "@/components/step-dots";

type Step = "phone" | "otp" | "password";
const STEP_INDEX: Record<Step, number> = { phone: 0, otp: 1, password: 2 };

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePhoneSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await requestPasswordResetOtp({ phone });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep("otp");
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await verifyPasswordResetOtp({ phone, code });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep("password");
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await completePasswordReset({ phone, password, confirmPassword });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    }
  }

  async function handleResend() {
    setError(null);
    const result = await requestPasswordResetOtp({ phone });
    if (!result.ok) setError(result.error);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">
        {step === "phone" && "Enter your phone number to receive a verification code."}
        {step === "otp" && `Enter the 6-digit code sent to ${phone}.`}
        {step === "password" && "Set a new password for your account."}
      </p>
      <StepDots total={3} current={STEP_INDEX[step]} />

      {step === "phone" && (
        <form onSubmit={handlePhoneSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="phone">Phone number</label>
            <input
              id="phone"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01712345678"
              inputMode="numeric"
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary mt-1" disabled={loading}>
            {loading ? "Sending code..." : "Send verification code"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleOtpSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="code">Verification code</label>
            <input
              id="code"
              className="input-field tracking-[0.3em] text-center"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary mt-1" disabled={loading}>
            {loading ? "Verifying..." : "Verify code"}
          </button>
          <button type="button" onClick={handleResend} className="text-sm text-primary hover:underline">
            Resend code
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handlePasswordSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary mt-1" disabled={loading}>
            {loading ? "Saving..." : "Reset password"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        Remembered your password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
