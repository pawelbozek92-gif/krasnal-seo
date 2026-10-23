/**
 * Single source of truth for every price on the site (PLN netto).
 * Cards, calculator, comparison table, audit page and JSON-LD all read from here.
 */

export type PackageId = 'start' | 'growth' | 'scale';

export interface RetainerPackage {
  id: PackageId;
  name: string;
  /** PLN netto per month. */
  priceNet: number;
  /** Expert hours included per month. */
  hours: number;
  tagline: string;
  highlight?: boolean;
  /** Short list for the pricing card. */
  inclusions: string[];
}

export const packages: RetainerPackage[] = [
  {
    id: 'start',
    name: 'START',
    priceNet: 3000,
    hours: 11,
    tagline: 'Solidne fundamenty i stała opieka techniczna.',
    inclusions: [
      'Monitoring techniczny serwisu',
      'Optymalizacja on-page',
      '2 briefy treści miesięcznie',
      'Raportowanie z GSC i GA4',
      'Comiesięczna rozmowa podsumowująca',
    ],
  },
  {
    id: 'growth',
    name: 'GROWTH',
    priceNet: 5000,
    hours: 18,
    highlight: true,
    tagline: 'Systematyczny wzrost ruchu i zapytań z Google.',
    inclusions: [
      'Wszystko z pakietu START',
      'Realizacja planu treści (4 briefy lub aktualizacje)',
      'Linkowanie wewnętrzne',
      'Zarządzanie link buildingiem',
      'Kwartalny przegląd strategii',
    ],
  },
  {
    id: 'scale',
    name: 'SCALE',
    priceNet: 8000,
    hours: 28,
    tagline: 'Dla rozbudowanych serwisów i ambitnych celów.',
    inclusions: [
      'Wszystko z pakietu GROWTH',
      'Obsługa serwisów wielosekcyjnych',
      'Landing pages i CRO we współpracy z developerami',
      'Digital PR',
      'Cotygodniowe spotkania statusowe',
    ],
  },
];

export type ProjectId = 'audit' | 'strategy' | 'consulting';

export interface Project {
  id: ProjectId;
  name: string;
  priceNet: number;
  unit: 'one-off' | 'hour';
  description: string;
  items: string[];
  href?: string;
}

export const projects: Project[] = [
  {
    id: 'audit',
    name: 'Audyt SEO + roadmapa na 90 dni',
    priceNet: 4500,
    unit: 'one-off',
    description: 'Pełny obraz stanu serwisu i lista działań uszeregowana według wpływu na biznes.',
    items: [
      'Crawl techniczny i analiza indeksacji',
      'Luka treściowa i analiza konkurencji',
      'Roadmapa priorytetów na 90 dni',
      '1 h rozmowy omawiającej wyniki',
    ],
    href: '/audyt-seo/',
  },
  {
    id: 'strategy',
    name: 'Analiza słów kluczowych i strategia treści',
    priceNet: 3000,
    unit: 'one-off',
    description: 'Mapa tematów, które realnie przyciągają Twoich klientów B2B.',
    items: [
      'Pełne uniwersum słów kluczowych',
      'Grupowanie według intencji',
      'Mapa tematyczna serwisu',
      'Kalendarz treści na 6 miesięcy',
    ],
  },
  {
    id: 'consulting',
    name: 'Konsultacje i warsztaty',
    priceNet: 250,
    unit: 'hour',
    description: 'Wsparcie doraźne: decyzje, briefingi i szkolenia zespołu.',
    items: ['Konsultacje ad hoc', 'Briefingi dla developerów', 'Szkolenia zespołów in-house'],
  },
];

export const projectById = (id: ProjectId) => projects.find((p) => p.id === id)!;

/** Share of the audit price credited when a retainer is signed within the window. */
export const auditCredit = { rate: 0.5, windowDays: 30 };
export const auditCreditAmount = projectById('audit').priceNet * auditCredit.rate;

/** Calculator ranges. */
export const consultingHoursRange = { min: 0, max: 20 };
export const contentBudgetRange = { min: 0, max: 5000, step: 250 };

/** Monthly budget options in the contact form; `max` is used to preselect from the calculator. */
export const budgetOptions = [
  { value: 'do-3000', label: 'do 3 000 zł', max: 3000 },
  { value: '3000-5000', label: '3 000–5 000 zł', max: 5000 },
  { value: '5000-8000', label: '5 000–8 000 zł', max: 8000 },
  { value: 'powyzej-8000', label: 'powyżej 8 000 zł', max: Infinity },
  { value: 'nie-wiem', label: 'nie wiem', max: -1 },
];

export const commercialTerms = [
  'Okres startowy 3 miesiące, potem współpraca z miesiąca na miesiąc z 1-miesięcznym okresem wypowiedzenia.',
  'Abonament fakturowany z góry; projekty: 50% przed startem, 50% po oddaniu.',
  'Budżety na treści i linki są opcjonalne, co miesiąc akceptowane przez Ciebie i rozliczane osobno – nigdy nie są ukryte w pakiecie.',
  'Bez gwarancji pozycji: co miesiąc raportuję uzgodnione KPI i wykorzystane godziny.',
  'Coroczna indeksacja cen.',
];

/** Rows of the comparison table. `true` = included, `false` = not included, string = value. */
export const comparisonRows: { label: string; values: Record<PackageId, boolean | string> }[] = [
  { label: 'Godziny eksperta w miesiącu', values: { start: '11 h', growth: '18 h', scale: '28 h' } },
  { label: 'Monitoring techniczny serwisu', values: { start: true, growth: true, scale: true } },
  { label: 'Optymalizacja on-page', values: { start: true, growth: true, scale: true } },
  { label: 'Briefy treści', values: { start: '2 / mies.', growth: '4 / mies.', scale: '4 / mies.' } },
  { label: 'Raport GSC i GA4 z wykorzystanymi godzinami', values: { start: true, growth: true, scale: true } },
  { label: 'Spotkania', values: { start: 'co miesiąc', growth: 'co miesiąc', scale: 'co tydzień' } },
  { label: 'Realizacja planu treści (briefy lub aktualizacje)', values: { start: false, growth: true, scale: true } },
  { label: 'Linkowanie wewnętrzne', values: { start: false, growth: true, scale: true } },
  { label: 'Zarządzanie link buildingiem', values: { start: false, growth: true, scale: true } },
  { label: 'Kwartalny przegląd strategii', values: { start: false, growth: true, scale: true } },
  { label: 'Serwisy wielosekcyjne', values: { start: false, growth: false, scale: true } },
  { label: 'Landing pages i CRO z developerami', values: { start: false, growth: false, scale: true } },
  { label: 'Digital PR', values: { start: false, growth: false, scale: true } },
];
