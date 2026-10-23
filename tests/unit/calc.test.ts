import { describe, expect, it } from 'vitest';
import { calculate, type CalcInput } from '../../src/lib/calc';
import { packages, projectById, auditCreditAmount, consultingHoursRange, contentBudgetRange } from '../../src/data/pricing';

const base: CalcInput = { packageId: 'growth', audit: false, strategy: false, consultingHours: 0, contentBudget: 0 };
const price = (id: string) => packages.find((p) => p.id === id)!.priceNet;

describe('calculate', () => {
  it('returns the package price and hours for a plain retainer', () => {
    const r = calculate(base);
    expect(r.retainer).toBe(price('growth'));
    expect(r.hours).toBe(packages.find((p) => p.id === 'growth')!.hours);
    expect(r.monthlyTotal).toBe(price('growth'));
    expect(r.oneOffTotal).toBe(0);
    expect(r.auditCredit).toBe(0);
    expect(r.firstMonthTotal).toBe(price('growth'));
  });

  it('matches the reference scenario from the brief', () => {
    const r = calculate({ packageId: 'scale', audit: true, strategy: true, consultingHours: 4, contentBudget: 1250 });
    expect(r.monthlyTotal).toBe(8000 + 1250);
    expect(r.oneOffTotal).toBe(4500 + 3000 + 4 * 250);
    expect(r.auditCredit).toBe(2250);
    expect(r.firstMonthTotal).toBe(9250 + 8500 - 2250);
  });

  it('applies the audit credit only when audit and a retainer are both selected', () => {
    expect(calculate({ ...base, audit: true }).auditCredit).toBe(auditCreditAmount);
    expect(calculate({ ...base, audit: true, packageId: 'none' }).auditCredit).toBe(0);
    expect(calculate({ ...base, audit: false }).auditCredit).toBe(0);
  });

  it('credits exactly 50% of the audit price', () => {
    expect(auditCreditAmount).toBe(projectById('audit').priceNet / 2);
  });

  it('handles "bez abonamentu"', () => {
    const r = calculate({ ...base, packageId: 'none', strategy: true });
    expect(r.packageName).toBeNull();
    expect(r.retainer).toBe(0);
    expect(r.hours).toBe(0);
    expect(r.firstMonthTotal).toBe(projectById('strategy').priceNet);
  });

  it('keeps the content budget out of the retainer but in the monthly total', () => {
    const r = calculate({ ...base, contentBudget: 2000 });
    expect(r.retainer).toBe(price('growth'));
    expect(r.contentBudget).toBe(2000);
    expect(r.monthlyTotal).toBe(price('growth') + 2000);
  });

  it('clamps consulting hours to the allowed range', () => {
    expect(calculate({ ...base, consultingHours: 99 }).consultingHours).toBe(consultingHoursRange.max);
    expect(calculate({ ...base, consultingHours: -3 }).consultingHours).toBe(consultingHoursRange.min);
    expect(calculate({ ...base, consultingHours: Number.NaN }).consultingHours).toBe(0);
  });

  it('snaps and clamps the content budget to the slider steps', () => {
    expect(calculate({ ...base, contentBudget: 1300 }).contentBudget).toBe(1250);
    expect(calculate({ ...base, contentBudget: 99999 }).contentBudget).toBe(contentBudgetRange.max);
    expect(calculate({ ...base, contentBudget: -500 }).contentBudget).toBe(0);
  });
});
