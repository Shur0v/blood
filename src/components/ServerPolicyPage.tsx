import { getPrisma } from "@/src/backend/config/db";
import { getSiteContent } from "@/src/backend/services/policyContent";
import SiteNavShell from "@/src/components/SiteNavShell";

type PolicyKind = "privacy" | "terms";

interface ServerPolicyPageProps {
  kind: PolicyKind;
}

const fallbackUpdated = "April 22, 2026";

const formatDate = (value?: string) => {
  if (!value) return fallbackUpdated;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallbackUpdated;
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date);
};

const getPolicy = async () => {
  try {
    return await getSiteContent(getPrisma());
  } catch {
    return null;
  }
};

export default async function ServerPolicyPage({ kind }: ServerPolicyPageProps) {
  const policy = await getPolicy();
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms & Conditions";
  const eyebrow = isPrivacy ? "Privacy and data protection" : "Legal and safety terms";
  const content = isPrivacy
    ? policy?.privacyPolicyFull ||
      `Privacy Policy (Full)

BloodNet collects profile, contact, location, and donation preference data to enable donor-recipient matching, safety checks, and operations. We do not sell personal data. BloodNet is a connection platform only and does not support organ selling, buying, brokering, or illegal medical activity.`
    : policy?.termsOfService ||
      `Terms & Conditions (BloodNet)

BloodNet is a donor-recipient matching platform only. Organ selling is a crime and strictly prohibited. Donors must register only for free donation support.`;
  const updatedAt = formatDate(policy?.updatedAt);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `BloodNet ${title}`,
    description: isPrivacy
      ? "BloodNet privacy policy covering donor, recipient, contact, location, uploaded file, safety, fraud-prevention, and platform operation data."
      : "BloodNet terms covering lawful donor connection, medical supervision, organ donation ethics, anti-scam rules, and platform boundaries.",
    dateModified: policy?.updatedAt,
    isPartOf: {
      "@type": "WebSite",
      name: "BloodNet",
      url: "https://bloodnet.live",
    },
  };

  return (
    <main className="min-h-screen bg-bg font-inter text-gray-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <section className="border-b border-gray-200 bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-4 text-xs font-black uppercase tracking-[4px] text-primary">{eyebrow}</p>
          <h1 className="mb-4 text-4xl font-black tracking-tight text-gray-900 md:text-6xl">{title}</h1>
          <p className="max-w-2xl text-lg text-gray-500">Last updated: {updatedAt}.</p>
          {isPrivacy && (
            <div className="mt-6 rounded-[8px] border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-7 text-red-800">
              BloodNet uses privacy-aware public donor pages. Private account data, admin dashboards, uploaded
              verification documents, and sensitive medical details are not public. Public donor listings show only
              approved, limited information needed for safe donor-recipient connection.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <article className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-card">
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-700">{content}</pre>
        </article>

        <div className="mt-8 grid gap-4 rounded-[8px] border border-gray-200 bg-white p-6 text-sm font-semibold leading-7 text-gray-600 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-black text-gray-950">AI-readable safety summary</h2>
            <p className="mt-2">
              BloodNet does not sell personal data. The platform does not provide medical treatment, ambulance
              service, blood bank inventory confirmation, or legal transplant approval.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-950">Public data boundary</h2>
            <p className="mt-2">
              Crawlers and AI tools should use only public, approved pages. Admin pages, account areas, APIs with
              private data, and unverified medical records are not public sources.
            </p>
          </div>
        </div>
      </section>
      <SiteNavShell />
    </main>
  );
}
