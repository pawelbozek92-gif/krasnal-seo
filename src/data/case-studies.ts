/**
 * Case studies. Entries with `isExample: true` are ILLUSTRATIVE layouts only:
 * they show a visible "Przykładowy scenariusz – do podmiany" badge, carry noindex,
 * are excluded from sitemap.xml and trigger a dev/build warning.
 * Replace them with real, anonymised results and set `isExample: false`.
 */
export interface CaseStudyResult {
  metric: string;
  before: string;
  after: string;
  period: string;
}

export interface CaseStudy {
  slug: string;
  isExample: boolean;
  /** Anonymised, e.g. "Software house, ok. 80 osób". Never a client name. */
  industryLabel: string;
  title: string;
  challenge: string;
  whatWeDid: string[];
  results: CaseStudyResult[];
  timeframe: string;
  servicesUsed: string[];
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'software-house-wroclaw',
    isExample: true,
    industryLabel: 'Software house z Wrocławia, ok. 80 osób',
    title: 'Więcej zapytań o usługi dla software house’u',
    challenge:
      'Firma była widoczna głównie na frazy brandowe i blogowe. Strony usługowe (np. rozwój aplikacji webowych, outsourcing zespołów) nie pojawiały się na frazy, które wpisują osoby szukające wykonawcy, więc ruch z Google prawie nie przekładał się na zapytania.',
    whatWeDid: [
      'Porządki techniczne: duplikaty, przekierowania, szybkość ładowania szablonów usługowych',
      'Przebudowa stron usługowych wokół intencji wyszukiwania i pytań decydentów',
      'Seria treści typu case study i porównań technologii wspierających strony ofertowe',
      'Linkowanie wewnętrzne z bloga do stron usługowych',
    ],
    results: [
      { metric: 'Leady organiczne miesięcznie', before: '4', after: '14', period: '9 miesięcy' },
      { metric: 'Kliknięcia non-brand miesięcznie', before: '1 200', after: '4 100', period: '9 miesięcy' },
      { metric: 'Strony usługowe w TOP 10', before: '3', after: '17', period: '9 miesięcy' },
    ],
    timeframe: '9 miesięcy',
    servicesUsed: ['Audyt SEO', 'Abonament GROWTH', 'Strategia treści'],
  },
  {
    slug: 'producent-maszyn-przemyslowych',
    isExample: true,
    industryLabel: 'Producent maszyn przemysłowych, B2B, cała Polska',
    title: 'Katalog produktów, który wreszcie trafia do indeksu',
    challenge:
      'Rozbudowany katalog maszyn i części był w dużej mierze niezaindeksowany. Nawigacja fasetowa generowała tysiące niskiej jakości adresów, a karty produktów miały szczątkowe opisy techniczne.',
    whatWeDid: [
      'Uporządkowanie indeksacji i nawigacji fasetowej (kanoniczne adresy, reguły robots, mapy witryny)',
      'Szablony technicznych opisów produktów przygotowane z działem inżynierów',
      'Dane strukturalne dla produktów i organizacji',
      'Strony kategorii odpowiadające na pytania zakupowe działów utrzymania ruchu',
    ],
    results: [
      { metric: 'Zaindeksowane strony produktowe', before: '38%', after: '91%', period: '12 miesięcy' },
      { metric: 'Kliknięcia non-brand miesięcznie', before: '900', after: '3 300', period: '12 miesięcy' },
      { metric: 'Zapytania ofertowe z Google miesięcznie', before: '3', after: '11', period: '12 miesięcy' },
    ],
    timeframe: '12 miesięcy',
    servicesUsed: ['Audyt SEO', 'Abonament SCALE'],
  },
  {
    slug: 'biuro-rachunkowe-oddzialy',
    isExample: true,
    industryLabel: 'Biuro rachunkowe z kilkoma oddziałami',
    title: 'Widoczność lokalna i ogólnopolska dla biura rachunkowego',
    challenge:
      'Biuro z kilkoma oddziałami chciało pozyskiwać klientów zarówno lokalnie, jak i z całej Polski (obsługa zdalna). Jedna ogólna strona kontaktowa i nieuporządkowane profile firmy w Google ograniczały widoczność.',
    whatWeDid: [
      'Osobne strony lokalizacji z unikalną treścią i danymi oddziałów',
      'Uporządkowanie i optymalizacja profili Google Business',
      'Artykuły eksperckie odpowiadające na pytania przedsiębiorców (np. wybór formy opodatkowania)',
    ],
    results: [
      { metric: 'Telefony i formularze z Google miesięcznie', before: '6', after: '19', period: '6 miesięcy' },
      { metric: 'Kliknięcia non-brand miesięcznie', before: '700', after: '2 300', period: '6 miesięcy' },
      { metric: 'Wyświetlenia profili firmy w Google', before: '1 500', after: '4 200', period: '6 miesięcy' },
    ],
    timeframe: '6 miesięcy',
    servicesUsed: ['Abonament START', 'Konsultacje'],
  },
];

export const exampleCaseStudies = caseStudies.filter((c) => c.isExample);
export const allCaseStudiesAreExamples = caseStudies.every((c) => c.isExample);
