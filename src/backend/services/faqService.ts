import type { PrismaClient } from "@prisma/client";

export type FaqItemPayload = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_FAQS: Array<{ question: string; answer: string; sortOrder: number; isActive: boolean }> = [
  {
    question: "Is BloodNet free to use for donors and recipients?",
    answer:
      "Yes. BloodNet is a free donor-recipient matching platform. We do not allow payment for blood or organs on the platform.",
    sortOrder: 1,
    isActive: true,
  },
  {
    question: "Does BloodNet allow buying or selling organs?",
    answer:
      "No. Organ trade is illegal and strictly prohibited. BloodNet only supports ethical, voluntary, and law-compliant matching workflows.",
    sortOrder: 2,
    isActive: true,
  },
  {
    question: "How should I handle transportation payment in urgent blood cases?",
    answer:
      "If you choose to support transportation, only pay after the donor physically reaches the verified hospital/medical location.",
    sortOrder: 3,
    isActive: true,
  },
  {
    question: "How does BloodNet help prevent scams and abuse?",
    answer:
      "We use moderation, report workflows, and policy enforcement. Suspicious accounts or illegal activity can be restricted or removed.",
    sortOrder: 4,
    isActive: true,
  },
  {
    question: "Does BloodNet provide medical treatment or diagnosis?",
    answer:
      "No. BloodNet is a coordination platform only. Medical decisions must be made by licensed healthcare professionals.",
    sortOrder: 5,
    isActive: true,
  },
];

const toPayload = (row: {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}): FaqItemPayload => ({
  id: row.id,
  question: row.question,
  answer: row.answer,
  sortOrder: row.sort_order,
  isActive: row.is_active,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const ensureDefaultFaqs = async (prisma: PrismaClient) => {
  const count = await prisma.faqItem.count();
  if (count > 0) return;

  await prisma.faqItem.createMany({
    data: DEFAULT_FAQS.map((item) => ({
      question: item.question,
      answer: item.answer,
      sort_order: item.sortOrder,
      is_active: item.isActive,
    })),
  });
};

export const getAllFaqs = async (prisma: PrismaClient): Promise<FaqItemPayload[]> => {
  await ensureDefaultFaqs(prisma);
  const rows = await prisma.faqItem.findMany({
    orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
  });
  return rows.map(toPayload);
};

export const getPublicFaqs = async (prisma: PrismaClient): Promise<FaqItemPayload[]> => {
  await ensureDefaultFaqs(prisma);
  const rows = await prisma.faqItem.findMany({
    where: { is_active: true },
    orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
  });
  return rows.map(toPayload);
};
