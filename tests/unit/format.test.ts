import { describe, expect, it } from 'vitest';
import { formatPLN, toGross } from '../../src/lib/format';

const NBSP = ' ';

describe('formatPLN', () => {
  it('groups thousands with a non-breaking space, also for 4-digit numbers', () => {
    expect(formatPLN(3000)).toBe(`3${NBSP}000${NBSP}zł`);
    expect(formatPLN(12500)).toBe(`12${NBSP}500${NBSP}zł`);
  });

  it('omits decimals for whole amounts and shows two otherwise', () => {
    expect(formatPLN(250)).toBe(`250${NBSP}zł`);
    expect(formatPLN(307.5)).toBe(`307,50${NBSP}zł`);
    expect(formatPLN(1537.5)).toBe(`1${NBSP}537,50${NBSP}zł`);
  });

  it('uses a typographic minus for negative amounts', () => {
    expect(formatPLN(-2250)).toBe(`−2${NBSP}250${NBSP}zł`);
  });

  it('formats zero', () => {
    expect(formatPLN(0)).toBe(`0${NBSP}zł`);
  });
});

describe('toGross', () => {
  it('adds VAT and rounds to grosze', () => {
    expect(toGross(3000, 0.23)).toBe(3690);
    expect(toGross(250, 0.23)).toBe(307.5);
    expect(toGross(1, 0.23)).toBe(1.23);
  });
});
