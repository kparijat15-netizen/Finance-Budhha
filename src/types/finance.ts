import { z } from "zod";

export const debtRepaymentStrategySchema = z.enum(["snowball", "avalanche"]);

export type DebtRepaymentStrategy = z.infer<typeof debtRepaymentStrategySchema>;

export const currencyStringSchema = z
  .string()
  .trim()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, "Invalid currency format")
  .transform((value: string) => Number(value));

export const nonNegativeCurrencySchema = z
  .number({ error: "Amount must be a number" })
  .finite()
  .min(0, "Amount cannot be negative");

export const annualInterestRateSchema = z
  .number({ error: "Interest rate must be a number" })
  .finite()
  .min(0, "Interest rate cannot be negative")
  .max(100, "Interest rate cannot exceed 100%");

export const incomeSourceTypeSchema = z.enum(["salary", "bonus", "other"]);
export type IncomeSourceType = z.infer<typeof incomeSourceTypeSchema>;

export const incomeEntrySchema = z.object({
  id: z.string().min(1),
  source: incomeSourceTypeSchema,
  amount: nonNegativeCurrencySchema,
  receivedAt: z.string().datetime(),
  note: z.string().max(240).optional(),
});
export type IncomeEntry = z.infer<typeof incomeEntrySchema>;

export const emiLoanSchema = z.object({
  id: z.string().min(1),
  lenderName: z.string().min(1).max(120),
  label: z.string().min(1).max(120),
  principalOutstanding: nonNegativeCurrencySchema,
  annualInterestRate: annualInterestRateSchema,
  monthlyEmi: nonNegativeCurrencySchema,
  minMonthlyPayment: nonNegativeCurrencySchema.optional(),
  openedOn: z.string().date().optional(),
  dueDayOfMonth: z.number().int().min(1).max(31),
  isActive: z.boolean().default(true),
});
export type EmiLoan = z.infer<typeof emiLoanSchema>;

export const unnecessarySpendSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1).max(80),
  amount: nonNegativeCurrencySchema,
  spentAt: z.string().datetime(),
  merchant: z.string().max(120).optional(),
  memo: z.string().max(240).optional(),
});
export type UnnecessarySpend = z.infer<typeof unnecessarySpendSchema>;

export const monthlyFinanceSnapshotSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM"),
  incomes: z.array(incomeEntrySchema).default([]),
  emiLoans: z.array(emiLoanSchema).default([]),
  unnecessarySpends: z.array(unnecessarySpendSchema).default([]),
  strategy: debtRepaymentStrategySchema.default("avalanche"),
});
export type MonthlyFinanceSnapshot = z.infer<typeof monthlyFinanceSnapshotSchema>;

export const bonusOptimizationInputSchema = z.object({
  bonusAmount: nonNegativeCurrencySchema,
  loans: z.array(emiLoanSchema).min(1, "At least one EMI loan is required"),
});
export type BonusOptimizationInput = z.infer<typeof bonusOptimizationInputSchema>;

export type BonusOptimizationRecommendation = {
  recommendedLoanId: string;
  compareLoanId: string;
  interestSavedIfRecommended: number;
  interestSavedIfCompared: number;
  deltaSaved: number;
};
