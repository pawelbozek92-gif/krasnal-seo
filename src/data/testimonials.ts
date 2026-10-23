/**
 * Real, approved client quotes only. While this list is empty the
 * Testimonials component renders nothing. Never add invented quotes.
 */
export interface Testimonial {
  quote: string;
  /** e.g. "Dyrektor marketingu" – add a person's name only with written consent. */
  role: string;
  company?: string;
}

export const testimonials: Testimonial[] = [];
