import { z } from "zod";

export const goalStatusSchema = z.enum(["not_started", "in_progress", "completed", "skipped"]);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

export const nonNegativeNumberSchema = z
  .number({ error: "Value must be a number" })
  .finite()
  .min(0, "Value cannot be negative");

export const macroProgressSchema = z.object({
  proteinGrams: nonNegativeNumberSchema,
  carbsGrams: nonNegativeNumberSchema,
  fatsGrams: nonNegativeNumberSchema,
});
export type MacroProgress = z.infer<typeof macroProgressSchema>;

export const dietGoalSchema = z.object({
  targetCalories: nonNegativeNumberSchema,
  consumedCalories: nonNegativeNumberSchema,
  targetMacros: macroProgressSchema,
  consumedMacros: macroProgressSchema,
});
export type DietGoal = z.infer<typeof dietGoalSchema>;

export const smokingCessationGoalSchema = z.object({
  lastSmokeAt: z.string().datetime(),
  baselineCigarettesPerDay: nonNegativeNumberSchema,
  pricePerCigarette: nonNegativeNumberSchema.default(0.5),
  cigarettesAvoidedToday: nonNegativeNumberSchema.default(0),
});
export type SmokingCessationGoal = z.infer<typeof smokingCessationGoalSchema>;

export type SmokingLiveStats = {
  elapsedMs: number;
  elapsedText: string;
  estimatedCigarettesAvoided: number;
  moneySaved: number;
};

export const dailyGoalRecordSchema = z.object({
  id: z.string().min(1),
  date: z.string().date(),
  diet: dietGoalSchema,
  smoking: smokingCessationGoalSchema,
  status: goalStatusSchema.default("in_progress"),
  notes: z.string().max(300).optional(),
});
export type DailyGoalRecord = z.infer<typeof dailyGoalRecordSchema>;
