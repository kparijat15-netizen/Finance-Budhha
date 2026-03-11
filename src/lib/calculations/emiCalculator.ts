import { z } from "zod";

import {
  bonusOptimizationInputSchema,
  emiLoanSchema,
  type EmiLoan,
} from "../../types/finance";

const MAX_SIMULATION_MONTHS = 1200;
const PAYOFF_EPSILON = 0.01;

const applyExtraPaymentInputSchema = z.object({
  loan: emiLoanSchema,
  extraPayment: z.number().finite().min(0),
});

export type LoanPayoffSimulation = {
  monthsToPayoff: number;
  totalInterestPaid: number;
  isNegativeAmortization: boolean;
};

export type EmiBonusInterestSavingsResult = {
  highestInterestLoanId: string;
  lowestInterestLoanId: string;
  interestSavedOnHighest: number;
  interestSavedOnLowest: number;
  extraInterestSavedByChoosingHighest: number;
  recommendedAction: "highest_interest" | "lowest_interest";
};

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function simulateLoanPayoff(
  principalOutstanding: number,
  annualInterestRate: number,
  monthlyPayment: number,
): LoanPayoffSimulation {
  let principal = principalOutstanding;
  let totalInterestPaid = 0;
  let monthsToPayoff = 0;

  const monthlyRate = annualInterestRate / 100 / 12;

  while (principal > PAYOFF_EPSILON && monthsToPayoff < MAX_SIMULATION_MONTHS) {
    const interest = principal * monthlyRate;
    const payment = Math.min(monthlyPayment, principal + interest);

    if (payment <= interest) {
      return {
        monthsToPayoff,
        totalInterestPaid: roundCurrency(totalInterestPaid),
        isNegativeAmortization: true,
      };
    }

    const principalPaid = payment - interest;
    principal = Math.max(0, principal - principalPaid);
    totalInterestPaid += interest;
    monthsToPayoff += 1;
  }

  return {
    monthsToPayoff,
    totalInterestPaid: roundCurrency(totalInterestPaid),
    isNegativeAmortization: false,
  };
}

export function calculateInterestSavedFromExtraPayment(params: {
  loan: EmiLoan;
  extraPayment: number;
}): number {
  const { loan, extraPayment } = applyExtraPaymentInputSchema.parse(params);

  const baseline = simulateLoanPayoff(
    loan.principalOutstanding,
    loan.annualInterestRate,
    loan.monthlyEmi,
  );

  const reducedPrincipal = Math.max(0, loan.principalOutstanding - extraPayment);
  const withExtra = simulateLoanPayoff(
    reducedPrincipal,
    loan.annualInterestRate,
    loan.monthlyEmi,
  );

  if (baseline.isNegativeAmortization || withExtra.isNegativeAmortization) {
    return 0;
  }

  return roundCurrency(Math.max(0, baseline.totalInterestPaid - withExtra.totalInterestPaid));
}

export function calculateBonusOptimizerInterestSavings(
  input: z.input<typeof bonusOptimizationInputSchema>,
): EmiBonusInterestSavingsResult {
  const { bonusAmount, loans } = bonusOptimizationInputSchema.parse(input);

  const activeLoans = loans
    .filter((loan: EmiLoan) => loan.isActive && loan.principalOutstanding > PAYOFF_EPSILON)
    .slice();

  if (activeLoans.length === 0) {
    throw new Error("No active loans available for optimization.");
  }

  if (activeLoans.length === 1) {
    const onlyLoan = activeLoans[0];
    const savings = calculateInterestSavedFromExtraPayment({
      loan: onlyLoan,
      extraPayment: bonusAmount,
    });

    return {
      highestInterestLoanId: onlyLoan.id,
      lowestInterestLoanId: onlyLoan.id,
      interestSavedOnHighest: savings,
      interestSavedOnLowest: savings,
      extraInterestSavedByChoosingHighest: 0,
      recommendedAction: "highest_interest",
    };
  }

  const byInterestAsc = [...activeLoans].sort(
    (a, b) => a.annualInterestRate - b.annualInterestRate,
  );

  const lowestInterestLoan = byInterestAsc[0];
  const highestInterestLoan = byInterestAsc[byInterestAsc.length - 1];

  const interestSavedOnHighest = calculateInterestSavedFromExtraPayment({
    loan: highestInterestLoan,
    extraPayment: bonusAmount,
  });

  const interestSavedOnLowest = calculateInterestSavedFromExtraPayment({
    loan: lowestInterestLoan,
    extraPayment: bonusAmount,
  });

  const extraInterestSavedByChoosingHighest = roundCurrency(
    interestSavedOnHighest - interestSavedOnLowest,
  );

  return {
    highestInterestLoanId: highestInterestLoan.id,
    lowestInterestLoanId: lowestInterestLoan.id,
    interestSavedOnHighest,
    interestSavedOnLowest,
    extraInterestSavedByChoosingHighest,
    recommendedAction:
      extraInterestSavedByChoosingHighest >= 0 ? "highest_interest" : "lowest_interest",
  };
}
