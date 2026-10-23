import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { hero, welcomeAudio, motion } from '../../src/data/motion';
import { describe, expect, it } from 'vitest';
import { packages, projects, comparisonRows, budgetOptions, contentBudgetRange } from '../../src/data/pricing';
import { caseStudies } from '../../src/data/case-studies';
import { pricingFaq } from '../../src/data/faq';
import { testimonials } from '../../src/data/testimonials';

describe('pricing data', () => {
  it('has START, GROWTH and SCALE in ascending price and hours', () => {
    expect(packages.map((p) => p.id)).toEqual(['start', 'growth', 'scale']);
    for (let i = 1; i < packages.length; i++) {
      expect(packages[i].priceNet).toBeGreaterThan(packages[i - 1].priceNet);
      expect(packages[i].hours).toBeGreaterThan(packages[i - 1].hours);
    }
  });

  it('highlights exactly one package (GROWTH)', () => {
    expect(packages.filter((p) => p.highlight).map((p) => p.id)).toEqual(['growth']);
  });

  it('has positive whole-złoty prices everywhere', () => {
    for (const item of [...packages, ...projects]) {
      expect(item.priceNet).toBeGreaterThan(0);
      expect(Number.isInteger(item.priceNet)).toBe(true);
    }
  });

  it('defines every comparison row for every package', () => {
    for (const row of comparisonRows) {
      for (const p of packages) expect(row.values).toHaveProperty(p.id);
    }
  });

  it('lists the same budget options the PHP handler accepts', () => {
    const php = readFileSync('public/api/contact.php', 'utf8');
    for (const o of budgetOptions) expect(php).toContain(`'${o.value}'`);
  });

  it('has a slider range divisible by its step', () => {
    expect((contentBudgetRange.max - contentBudgetRange.min) % contentBudgetRange.step).toBe(0);
  });
});

describe('case studies', () => {
  it('have unique, ASCII-only slugs (no Polish diacritics in URLs)', () => {
    const slugs = caseStudies.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  it('have complete result rows', () => {
    for (const c of caseStudies) {
      expect(c.results.length).toBeGreaterThan(0);
      for (const r of c.results) expect(r.metric && r.before && r.after && r.period).toBeTruthy();
    }
  });
});

describe('motion config', () => {
  it('points at media files that exist in public/', () => {
    const paths = [
      ...Object.values(hero.sources).flatMap((s) => [s.webm, s.mp4]),
      hero.poster,
      hero.staticImage,
      welcomeAudio.jingle.opus,
      welcomeAudio.jingle.mp3,
      welcomeAudio.voice.opus,
      welcomeAudio.voice.mp3,
    ];
    for (const p of paths) expect(existsSync(`public${p}`), p).toBe(true);
  });

  it('keeps no media or .wav files in the public root', () => {
    expect(readdirSync('public').filter((f) => /\.(wav|mp3|mp4|webm|opus)$/i.test(f))).toEqual([]);
  });

  it('has sane audio levels and timings', () => {
    expect(welcomeAudio.duckLevel).toBeGreaterThan(0);
    expect(welcomeAudio.duckLevel).toBeLessThan(1);
    expect(welcomeAudio.introSeconds).toBeGreaterThanOrEqual(welcomeAudio.duckRampSeconds);
    expect(welcomeAudio.fadeOutSeconds).toBeGreaterThan(0);
  });

  it('keeps every duration on the 200–900 ms scale', () => {
    for (const ms of Object.values(motion.durations)) {
      expect(ms).toBeGreaterThanOrEqual(200);
      expect(ms).toBeLessThanOrEqual(900);
    }
  });
});

describe('content rules', () => {
  it('pricing FAQ covers the six questions from the brief', () => {
    expect(pricingFaq).toHaveLength(6);
  });

  it('testimonials contain only entries with a quote and role', () => {
    for (const t of testimonials) expect(t.quote && t.role).toBeTruthy();
  });
});
