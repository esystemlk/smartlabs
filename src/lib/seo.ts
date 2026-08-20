import type { Metadata } from 'next';

/**
 * Central SEO config — keywords, per-page metadata helper and JSON-LD
 * structured-data generators. Used by the root layout and per-route layouts
 * so titles, descriptions, canonical URLs and rich results stay consistent.
 * Structured data doubles as GEO/AEO signal for AI answer engines.
 */

export const SITE = {
  name: 'Smart Labs',
  legalName: 'Smart Labs',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://smartlabs.lk',
  phone: '+94 77 453 3233',
  phoneDial: '0774533233',
  email: 'info@smartlabs.lk',
  logo: '/logo.png',
  areaServed: 'Sri Lanka',
  sameAs: [
    'https://www.youtube.com/@SmartLabs-Official',
    'https://www.facebook.com/smartlabs.lk',
    'https://www.instagram.com/smartlabs.lk',
    'https://www.tiktok.com/@smartlabs.lk',
  ],
  address: {
    street: '19/3 Poorwarama Rd',
    locality: 'Nugegoda',
    region: 'Western Province',
    postalCode: '10250',
    country: 'LK',
    lat: 6.8688,
    lng: 79.8898,
    full: '19/3 Poorwarama Rd, Nugegoda 10250, Sri Lanka',
  },
};

/** Base keyword set — local + long-tail intent that we want to rank for. */
export const BASE_KEYWORDS = [
  'PTE', 'PTE Academic', 'PTE Sri Lanka', 'PTE classes Sri Lanka', 'PTE coaching Sri Lanka',
  'best PTE class in Sri Lanka', 'best PTE classes in Sri Lanka', 'best PTE trainer',
  'best PTE trainer in Sri Lanka', 'best PTE institute in Sri Lanka', 'best PTE academy Sri Lanka',
  'PTE classes Nugegoda', 'PTE class Nugegoda', 'PTE institute Nugegoda', 'PTE classes Colombo', 'PTE online classes Sri Lanka',
  'PTE Academic preparation Sri Lanka', 'PTE Boostify', 'PTE mock test', 'PTE mock test Sri Lanka',
  'AI PTE practice', 'PTE speaking practice', 'PTE writing AI feedback', 'PTE tutor Sri Lanka',
  'PTE score improvement', 'IELTS Sri Lanka', 'IELTS classes Colombo', 'KET', 'PET',
  'English exam Sri Lanka', 'Smart Labs',
];

interface PageMetaInput {
  title: string;
  description: string;
  /** Path with leading slash, e.g. "/pte-registration". */
  path: string;
  keywords?: string[];
  image?: string;
}

/** Build a page's <head> metadata with canonical + OpenGraph + Twitter. */
export function pageMeta({ title, description, path, keywords = [], image = '/logo.png' }: PageMetaInput): Metadata {
  const url = `${SITE.url}${path}`;
  return {
    title,
    description,
    keywords: [...BASE_KEYWORDS, ...keywords],
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE.name,
      title,
      description,
      images: [{ url: image }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

// ─── JSON-LD structured data ────────────────────────────────────────────────

/** EducationalOrganization + LocalBusiness — the anchor for local & GEO SEO. */
export function orgJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: `${SITE.url}${SITE.logo}`,
    image: `${SITE.url}${SITE.logo}`,
    telephone: SITE.phone,
    email: SITE.email,
    description:
      'Smart Labs is a leading PTE Academic, IELTS, KET and PET training institute in Sri Lanka, offering AI-scored practice, mock tests and expert-led courses at our Nugegoda centre and online.',
    areaServed: { '@type': 'Country', name: SITE.areaServed },
    knowsAbout: ['PTE Academic', 'IELTS', 'KET', 'PET', 'English language testing', 'AI exam scoring'],
    sameAs: SITE.sameAs,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: SITE.address.lat, longitude: SITE.address.lng },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.address.full)}`,
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '250' },
  };
}

/** WebSite + SearchAction (enables the Google sitelinks search box). */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    publisher: { '@id': `${SITE.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.url}/blog?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Course schema for the PTE packages. */
export function courseJsonLd(courses: { name: string; description: string; price: number; url?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: courses.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Course',
        name: c.name,
        description: c.description,
        provider: { '@type': 'EducationalOrganization', name: SITE.name, sameAs: SITE.url },
        url: c.url ? `${SITE.url}${c.url}` : `${SITE.url}/pte-registration`,
        offers: {
          '@type': 'Offer',
          price: c.price,
          priceCurrency: 'LKR',
          category: 'Paid',
          availability: 'https://schema.org/InStock',
        },
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'Blended',
          courseWorkload: 'PT4W',
          location: { '@type': 'Place', name: 'Smart Labs, Nugegoda, Sri Lanka (Online + on-site)' },
        },
      },
    })),
  };
}

/** FAQPage schema — targets question-style and "best PTE" searches. */
export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** BreadcrumbList for a page's trail. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.path}`,
    })),
  };
}

/** Common questions used for the FAQ rich result + GEO answers. */
export const HOME_FAQS = [
  {
    q: 'Which is the best PTE class in Sri Lanka?',
    a: 'Smart Labs is one of the most trusted PTE Academic training institutes in Sri Lanka, offering AI-scored practice, full mock tests and expert-led PTE Boostify courses online and at our Nugegoda centre (19/3 Poorwarama Rd, Nugegoda).',
  },
  {
    q: 'Who is the best PTE trainer in Sri Lanka?',
    a: 'Smart Labs’ academic mentors are experienced PTE trainers who teach exam strategy, the marking system and high-weightage question techniques, backed by AI feedback and personalised WhatsApp correction support.',
  },
  {
    q: 'How much do PTE classes cost in Sri Lanka?',
    a: 'Smart Labs PTE Boostify courses start from LKR 35,000 for 28 hours of guided learning (PTE Boostify), with PTE Boostify Plus (LKR 40,000) and PTE Boostify Pro (LKR 50,000) adding feedback sessions and 30-day WhatsApp correction support.',
  },
  {
    q: 'Does Smart Labs offer online PTE classes?',
    a: 'Yes. Smart Labs runs live online PTE classes with two intakes per month (2:30 PM and 8:00 PM), plus AI practice, mock tests and recorded sessions you can access from anywhere in Sri Lanka.',
  },
  {
    q: 'Does Smart Labs provide PTE mock tests with AI scoring?',
    a: 'Yes. Smart Labs provides full-length PTE mock tests and AI-scored practice for Writing, Speaking, Summarize Written Text, Summarize Spoken Text and Write from Dictation with instant, criteria-based feedback.',
  },
];
