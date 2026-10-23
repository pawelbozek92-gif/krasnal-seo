/** JSON-LD builders (schema.org). Values marked TODO in site config are omitted. */
import { site, isSet } from '../config/site';
import { packages, projectById } from '../data/pricing';
import type { FaqItem } from '../data/faq';

export const abs = (path: string) => new URL(path, site.url).href;
export const ORG_ID = abs('/#organization');
export const PERSON_ID = abs('/o-mnie/#person');

export function organization() {
  const address: Record<string, string> = {
    '@type': 'PostalAddress',
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    addressCountry: site.address.country,
  };
  if (isSet(site.address.street)) address.streetAddress = site.address.street;
  if (isSet(site.address.postalCode)) address.postalCode = site.address.postalCode;

  return {
    '@type': 'ProfessionalService',
    '@id': ORG_ID,
    name: site.brandName,
    legalName: site.legalName,
    url: abs('/'),
    logo: abs('/icon-512.png'),
    image: abs('/og-default.png'),
    description:
      'Konsultant SEO z Wrocławia dla firm usługowych B2B z całej Polski. Przejrzyste pakiety z godzinami eksperta, raporty leadów i ruchu non-brand.',
    slogan: 'Małe zmiany, duże wyniki w Google.',
    areaServed: { '@type': 'Country', name: 'Polska' },
    address,
    founder: { '@id': PERSON_ID },
    priceRange: '250–8000 PLN',
    knowsLanguage: 'pl',
    ...(isSet(site.email) && { email: site.email }),
    ...(isSet(site.phone) && { telephone: site.phone }),
    ...(isSet(site.nip) && { taxID: site.nip }),
    ...(isSet(site.linkedinUrl) && { sameAs: [site.linkedinUrl] }),
  };
}

export function person() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: site.ownerName,
    jobTitle: 'Konsultant SEO',
    url: abs('/o-mnie/'),
    worksFor: { '@id': ORG_ID },
    address: { '@type': 'PostalAddress', addressLocality: site.address.city, addressCountry: site.address.country },
    knowsAbout: ['SEO', 'Techniczne SEO', 'Strategia treści', 'Digital PR', 'Google Search Console', 'GA4'],
    ...(isSet(site.linkedinUrl) && { sameAs: [site.linkedinUrl] }),
  };
}

export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function faqPage(items: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

const offer = (price: number, monthly: boolean, url: string) => ({
  '@type': 'Offer',
  price: price.toFixed(2),
  priceCurrency: 'PLN',
  url: abs(url),
  availability: 'https://schema.org/InStock',
  priceSpecification: {
    '@type': 'UnitPriceSpecification',
    price: price.toFixed(2),
    priceCurrency: 'PLN',
    valueAddedTaxIncluded: false,
    ...(monthly && { billingDuration: 'P1M', unitCode: 'MON', unitText: 'miesiąc' }),
  },
});

/** One Service + Offer per retainer package. */
export function packageServices() {
  return packages.map((p) => ({
    '@type': 'Service',
    '@id': abs(`/cennik/#pakiet-${p.id}`),
    name: `Abonament SEO ${p.name}`,
    serviceType: 'Pozycjonowanie stron (SEO)',
    description: `${p.tagline} ${p.hours} h pracy eksperta miesięcznie. ${p.inclusions.join(', ')}.`,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Polska' },
    offers: offer(p.priceNet, true, '/cennik/'),
  }));
}

export function auditService() {
  const audit = projectById('audit');
  return {
    '@type': 'Service',
    '@id': abs('/audyt-seo/#usluga'),
    name: audit.name,
    serviceType: 'Audyt SEO',
    description: `${audit.description} ${audit.items.join(', ')}.`,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Polska' },
    offers: offer(audit.priceNet, false, '/audyt-seo/'),
  };
}
