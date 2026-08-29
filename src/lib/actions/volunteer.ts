"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { paymentSubmissionSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function submitPaymentClaim(input: {
  amount: number;
  method: "CASH" | "BKASH" | "NAGAD";
  transactionId?: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };

  const parsed = paymentSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.paymentSubmission.create({
    data: {
      volunteerId: session.volunteerId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      transactionId: parsed.data.method === "CASH" ? null : parsed.data.transactionId,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
