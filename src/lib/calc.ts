/** Pure pricing-calculator logic (all amounts PLN netto). */
import {
  packages,
  projectById,
  auditCreditAmount,
  consultingHoursRange,
  contentBudgetRange,
  type PackageId,
} from '../data/pricing';

export interface CalcInput {
  packageId: PackageId | 'none';
  audit: boolean;
  strategy: boolean;
  consultingHours: number;
  contentBudget: number;
}

export interface CalcResult {
  packageName: string | null;
  retainer: number;
  hours: number;
  contentBudget: number;
  monthlyTotal: number;
  audit: number;
  strategy: number;
  consultingHours: number;
  consulting: number;
  oneOffTotal: number;
  /** Positive amount subtracted from the first month (0 when not applicable). */
  auditCredit: number;
  firstMonthTotal: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));

export function calculate(input: CalcInput): CalcResult {
  const pkg = packages.find((p) => p.id === input.packageId) ?? null;
  const hoursExtra = Math.round(clamp(input.consultingHours, consultingHoursRange.min, consultingHoursRange.max));
  const budget =
    Math.round(clamp(input.contentBudget, contentBudgetRange.min, contentBudgetRange.max) / contentBudgetRange.step) *
    contentBudgetRange.step;

  const retainer = pkg?.priceNet ?? 0;
  const audit = input.audit ? projectById('audit').priceNet : 0;
  const strategy = input.strategy ? projectById('strategy').priceNet : 0;
  const consulting = hoursExtra * projectById('consulting').priceNet;
  const monthlyTotal = retainer + budget;
  const oneOffTotal = audit + strategy + consulting;
  // 50% of the audit is credited only when a retainer is part of the configuration.
  const auditCredit = input.audit && pkg ? auditCreditAmount : 0;

  return {
    packageName: pkg?.name ?? null,
    retainer,
    hours: pkg?.hours ?? 0,
    contentBudget: budget,
    monthlyTotal,
    audit,
    strategy,
    consultingHours: hoursExtra,
    consulting,
    oneOffTotal,
    auditCredit,
    firstMonthTotal: monthlyTotal + oneOffTotal - auditCredit,
  };
}
