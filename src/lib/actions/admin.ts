"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { phoneSchema, passwordSchema, nameSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    throw new Error("Not authorized");
  }
  return session;
}

const createVolunteerSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  password: passwordSchema,
  isAdmin: z.boolean().optional().default(false),
});

export async function createVolunteer(input: {
  name: string;
  phone: string;
  password: string;
  isAdmin?: boolean;
}): Promise<ActionResult> {
  await requireAdmin();

  const parsed = createVolunteerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.volunteer.findUnique({ where: { phone: parsed.data.phone } });
  if (existing) {
    return { ok: false, error: "A volunteer with this phone number already exists." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.volunteer.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      passwordHash,
      isAdmin: parsed.data.isAdmin,
      phoneVerified: true,
    },
  });

  revalidatePath("/admin/volunteers");
  return { ok: true };
}

const addDueSchema = z.object({
  volunteerId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().trim().min(1, "Note is required").max(200),
});

export async function addDue(input: { volunteerId: string; amount: number; note: string }): Promise<ActionResult> {
  await requireAdmin();

  const parsed = addDueSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const volunteer = await prisma.volunteer.findUnique({ where: { id: parsed.data.volunteerId } });
  if (!volunteer) return { ok: false, error: "Volunteer not found" };

  await prisma.duePayment.create({
    data: {
      volunteerId: parsed.data.volunteerId,
      amount: parsed.data.amount,
      note: parsed.data.note,
      status: "PENDING",
    },
  });

  revalidatePath(`/admin/volunteers/${parsed.data.volunteerId}`);
  return { ok: true };
}

export async function markDuePaid(input: { dueId: string; volunteerId: string }): Promise<ActionResult> {
  await requireAdmin();

  await prisma.duePayment.update({
    where: { id: input.dueId },
    data: { status: "PAID" },
  });

  revalidatePath(`/admin/volunteers/${input.volunteerId}`);
  return { ok: true };
}

export async function setVolunteerAdmin(input: { volunteerId: string; isAdmin: boolean }): Promise<ActionResult> {
  const session = await requireAdmin();

  if (input.volunteerId === session.volunteerId && !input.isAdmin) {
    return { ok: false, error: "You can't remove your own admin access." };
  }

  const volunteer = await prisma.volunteer.findUnique({ where: { id: input.volunteerId } });
  if (!volunteer) return { ok: false, error: "Volunteer not found" };

  await prisma.volunteer.update({
    where: { id: input.volunteerId },
    data: { isAdmin: input.isAdmin },
  });

  revalidatePath(`/admin/volunteers/${input.volunteerId}`);
  revalidatePath("/admin");
  return { ok: true };
}

const reviewPaymentSchema = z.object({
  submissionId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  dueAmount: z.coerce.number().positive("Amount must be greater than 0").optional(),
  dueNote: z.string().trim().min(1, "Note is required").max(200).optional(),
});

export async function reviewPaymentSubmission(input: {
  submissionId: string;
  decision: "APPROVED" | "REJECTED";
  dueAmount?: number;
  dueNote?: string;
}): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = reviewPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const submission = await prisma.paymentSubmission.findUnique({
    where: { id: parsed.data.submissionId },
  });
  if (!submission) return { ok: false, error: "Submission not found" };
  if (submission.status !== "PENDING") {
    return { ok: false, error: "This submission has already been reviewed." };
  }

  if (parsed.data.decision === "REJECTED") {
    await prisma.paymentSubmission.update({
      where: { id: submission.id },
      data: { status: "REJECTED", reviewedBy: session.volunteerId, reviewedAt: new Date() },
    });
  } else {
    if (!parsed.data.dueAmount || !parsed.data.dueNote) {
      return { ok: false, error: "Confirm the amount and note to apply to the due balance." };
    }
    await prisma.$transaction([
      prisma.paymentSubmission.update({
        where: { id: submission.id },
        data: { status: "APPROVED", reviewedBy: session.volunteerId, reviewedAt: new Date() },
      }),
      prisma.duePayment.create({
        data: {
          volunteerId: submission.volunteerId,
          amount: parsed.data.dueAmount,
          note: parsed.data.dueNote,
          status: "PAID",
        },
      }),
    ]);
  }

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/volunteers/${submission.volunteerId}`);
  return { ok: true };
}

const eventSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(150),
  description: z.string().trim().min(1, "Description is required").max(2000),
  location: z.string().trim().min(1, "Location is required").max(200),
  eventDate: z.string().min(1, "Date and time are required"),
});

export async function createEvent(input: {
  title: string;
  description: string;
  location: string;
  eventDate: string;
}): Promise<ActionResult> {
  await requireAdmin();

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const eventDate = new Date(parsed.data.eventDate);
  if (Number.isNaN(eventDate.getTime())) {
    return { ok: false, error: "Invalid date" };
  }

  await prisma.event.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      eventDate,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateEvent(input: {
  id: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
}): Promise<ActionResult> {
  await requireAdmin();

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const eventDate = new Date(parsed.data.eventDate);
  if (Number.isNaN(eventDate.getTime())) {
    return { ok: false, error: "Invalid date" };
  }

  await prisma.event.update({
    where: { id: input.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      eventDate,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.event.delete({ where: { id } });
  revalidatePath("/admin/events");
  revalidatePath("/dashboard");
  return { ok: true };
}
