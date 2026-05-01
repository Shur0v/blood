import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeExperience } from "@/src/app/page";
import { KEYWORD_LANDINGS, getKeywordLandingBySlug } from "@/src/lib/keywordLandings";
import { getKeywordPageContent } from "@/src/lib/keywordPageContent";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

type Params = { slug: string };

export async function generateStaticParams() {
  return KEYWORD_LANDINGS.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getKeywordLandingBySlug(slug);
  if (!entry) return { title: "BloodNet Keyword Page", robots: { index: false, follow: true } };

  return {
    title: `${entry.keyword} | BloodNet`,
    description: `${entry.keyword}. Explore active donor discovery, emergency request support, and organ registry links on BloodNet.`,
    alternates: { canonical: `/keywords/${entry.slug}` },
    openGraph: {
      title: `${entry.keyword} | BloodNet`,
      description: `${entry.keyword}. Fast donor search and emergency support pages.`,
      url: `https://bloodnet.live/keywords/${entry.slug}`,
      type: "website",
    },
  };
}

export default async function KeywordLandingPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const entry = getKeywordLandingBySlug(slug);
  if (!entry) notFound();

  const content = getKeywordPageContent(entry.keyword);
  const related = KEYWORD_LANDINGS.filter((item) => item.slug !== entry.slug).slice(0, 18);

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 pt-16 pb-10">
        <section className="rounded-[8px] border border-border/20 bg-white/90 p-6 shadow-card">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">{entry.keyword}</h1>

          <h2 className="mt-6 text-xl font-black text-gray-900">Search Tags</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <span
                key={`${entry.slug}-tag-${tag}`}
                className="rounded-[8px] border border-border/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>

          {content.blocks.map((block, blockIndex) => (
            <section key={`${entry.slug}-block-${blockIndex}`} className="mt-7">
              <h2 className="text-xl font-black text-gray-900">{block.title}</h2>
              {block.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={`${entry.slug}-p-${blockIndex}-${paragraphIndex}`} className="mt-3 max-w-4xl text-sm font-medium leading-7 text-gray-700 md:text-base">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <h2 className="mt-7 text-xl font-black text-gray-900">Related Long-Tail Searches</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/keywords/${item.slug}`}
                className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm"
              >
                {item.keyword}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <HomeExperience />
    </>
  );
}
