import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  jsonLd?: Record<string, unknown>;
  noindex?: boolean;
}

const SITE_NAME = 'Le Touriste.bj';
const DEFAULT_DESCRIPTION = 'Découvrez et réservez les meilleurs voyages au Bénin. Épargne progressive, paiement flexible par Mobile Money, expériences authentiques.';
const DEFAULT_IMAGE = '/splash_screen.png';
const BASE_URL = 'https://letouriste.bj';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  jsonLd,
  noindex = false,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Voyages au Bénin`;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="fr_BJ" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export function buildVoyageJsonLd(voyage: {
  titre?: string;
  destination?: string;
  description?: string;
  totalPrice?: number;
  dateDebut?: string;
  dateFin?: string;
  photos?: string[];
  id?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: voyage.titre || voyage.destination || 'Voyage',
    description: voyage.description || '',
    touristType: 'Sightseeing',
    offers: {
      '@type': 'Offer',
      price: voyage.totalPrice || 0,
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
      url: `https://letouriste.bj/voyage/${voyage.id || ''}`,
    },
    ...(voyage.dateDebut && {
      startDate: voyage.dateDebut,
    }),
    ...(voyage.dateFin && {
      endDate: voyage.dateFin,
    }),
    ...(voyage.photos?.length && {
      image: voyage.photos[0],
    }),
    provider: {
      '@type': 'Organization',
      name: 'Le Touriste.bj',
      url: 'https://letouriste.bj',
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'Le Touriste.bj & Zepargn Voyage',
    url: 'https://voyage.zepargn.com',
    description: 'Réservez votre voyage de groupe avec 30% d\'acompte. Épargnez le solde progressivement avec Zepargn.',
    areaServed: [
      { '@type': 'Country', name: 'Bénin' },
      { '@type': 'Country', name: 'France' },
      { '@type': 'Country', name: 'Togo' },
    ],
    logo: 'https://voyage.zepargn.com/icon.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+229-01-61-38-28-69',
      contactType: 'customer service',
      availableLanguage: 'French',
    },
    sameAs: [
      'https://www.instagram.com/letouriste.bj',
      'https://www.tiktok.com/@letouriste.bj',
    ],
  };
}

export function buildFAQJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}
