/**
 * Single place for business details and integrations.
 * Every value that is still unknown is the string "TODO" (see README → "Before launch").
 * Values equal to "TODO" are hidden or rendered as a visible [TODO] marker, never as real data.
 */
export const TODO = 'TODO' as const;

export const site = {
  /** Final production URL, no trailing slash. TODO: confirm the domain before launch. */
  url: 'https://www.krasnalseo.pl',
  brandName: 'Krasnal SEO',
  /** Consultant / owner of the sole proprietorship (JDG). */
  ownerName: 'Paweł Bożek',
  /** Legal name exactly as in CEIDG. TODO: confirm. */
  legalName: 'Paweł Bożek Krasnal SEO',
  nip: TODO as string,
  address: {
    street: TODO as string,
    postalCode: TODO as string,
    city: 'Wrocław',
    region: 'dolnośląskie',
    country: 'PL',
  },
  email: TODO as string,
  /** Optional; shown in footer and contact page when set. Format: "+48 600 000 000". */
  phone: TODO as string,
  linkedinUrl: TODO as string,
  /** Cal.com / Calendly booking page, e.g. "https://cal.com/krasnal-seo/30min". */
  bookingUrl: TODO as string,
  /**
   * Where the contact form POSTs. Either the bundled PHP handler ("/api/contact.php")
   * or a form service such as Formspree ("https://formspree.io/f/xxxxxxx").
   */
  formEndpoint: '/api/contact.php',
  /** Google Analytics 4 measurement ID, e.g. "G-XXXXXXXXXX". Loaded only after consent. */
  ga4Id: TODO as string,
  /** Google Search Console HTML-tag verification code (content attribute only). */
  gscVerification: TODO as string,
  /** true → prices shown "netto + 23% VAT" with a netto/brutto toggle; false → "zwolniony z VAT". */
  vatPayer: true,
  vatRate: 0.23,
};

export const isSet = (value: string | undefined | null): value is string =>
  !!value && value !== TODO;

/** Renders a configured value or a clearly visible placeholder. */
export const orTodo = (value: string, label: string) => (isSet(value) ? value : `[TODO: ${label}]`);
