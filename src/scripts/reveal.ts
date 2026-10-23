/**
 * Scroll reveal: content below the fold fades/slides in once (600 ms, ease-out, 80 ms stagger).
 * Only elements outside the first viewport are touched, so there is no flash, no CLS and no LCP impact.
 * Skipped entirely for prefers-reduced-motion or without IntersectionObserver.
 */
import { motion } from '../data/motion';

const SELECTOR = [
  '.section-head',
  '.grid > *',
  '.steps > li',
  '.faq > details',
  '.ps__row',
  '.cta-band',
  '.terms',
  '.pricing-teaser__foot',
  '.outline > li',
  '.process > li',
]
  .map((s) => `main > section:not(:first-of-type) ${s}`)
  .join(',');

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce && 'IntersectionObserver' in window) {
  const below = [...document.querySelectorAll<HTMLElement>(SELECTOR)].filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight,
  );

  const done = (el: HTMLElement) => {
    el.removeAttribute('data-reveal');
    el.classList.remove('is-revealed');
    el.style.removeProperty('--reveal-delay');
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        io.unobserve(el);
        el.classList.add('is-revealed');
        // Hand transitions back to the element (hover effects) once revealed.
        el.addEventListener('transitionend', () => done(el), { once: true });
        window.setTimeout(() => done(el), motion.durations.slower + 400);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );

  const perParent = new Map<Element | null, number>();
  for (const el of below) {
    const i = perParent.get(el.parentElement) ?? 0;
    perParent.set(el.parentElement, i + 1);
    el.style.setProperty('--reveal-delay', `${Math.min(i, 4) * motion.revealStaggerMs}ms`);
    el.setAttribute('data-reveal', '');
    io.observe(el);
  }
}
