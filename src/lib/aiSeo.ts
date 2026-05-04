import { getPublicBaseUrl } from "@/src/backend/config/env";

const baseUrl = getPublicBaseUrl().replace(/\/$/, "");

export const buildMedicalOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  "@id": `${baseUrl}#medical-org`,
  name: "BloodNet",
  url: baseUrl,
  logo: `${baseUrl}/favicon.png`,
  description:
    "BloodNet is a blood and organ donor discovery platform for emergency matching, location based donor search, and safety-first coordination.",
  areaServed: ["India", "Pakistan", "Nepal", "Bangladesh"],
  sameAs: [
    `${baseUrl}/about`,
    `${baseUrl}/safety-policy`,
    `${baseUrl}/organ-donation-ethics`,
  ],
});

export const buildServiceSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${baseUrl}#donor-search-service`,
  name: "Emergency Blood And Organ Donor Search",
  provider: {
    "@id": `${baseUrl}#medical-org`,
  },
  serviceType: "Blood donor and organ donor discovery",
  areaServed: ["India", "Pakistan", "Nepal", "Bangladesh"],
  availableChannel: {
    "@type": "ServiceChannel",
    serviceUrl: baseUrl,
  },
});

export const buildDatasetSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Dataset",
  "@id": `${baseUrl}#donor-dataset`,
  name: "BloodNet City And Blood Group Donor Dataset",
  description:
    "Live city and blood group level donor listing dataset used for urgent blood and organ donor discovery pages.",
  url: `${baseUrl}/sitemap.xml`,
  creator: {
    "@id": `${baseUrl}#medical-org`,
  },
  includedInDataCatalog: {
    "@type": "DataCatalog",
    name: "BloodNet Public Search Pages",
    url: `${baseUrl}/global-search-entry`,
  },
  license: `${baseUrl}/terms`,
});

export const buildRegionalFaqSchema = (country: string, slug: string) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: `Where can I find emergency blood donors in ${country} right now`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `You can find active blood donor pages by city and blood group on BloodNet ${country} page at ${baseUrl}/${slug}.`,
      },
    },
    {
      "@type": "Question",
      name: `How to search O negative blood donors in ${country}`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Use the blood group and city filters to open location pages for O negative donors in ${country}.`,
      },
    },
    {
      "@type": "Question",
      name: `Is BloodNet safe for emergency blood requests in ${country}`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `BloodNet provides safety policy and ethics guidance and helps users connect through structured donor discovery pages.`,
      },
    },
  ],
});

export const buildKeywordFaqSchema = (keyword: string) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: `How can I use ${keyword} to find donors quickly`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Open this BloodNet page for ${keyword}, review matching location and blood group links, and contact available profiles for urgent coordination.`,
      },
    },
    {
      "@type": "Question",
      name: `Can I search by city and blood group for emergency cases`,
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. BloodNet supports city specific and blood group specific discovery pages for emergency use cases.",
      },
    },
  ],
});

export const stringifyJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

