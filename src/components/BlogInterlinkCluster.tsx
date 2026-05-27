import Link from "next/link";
import { getPrisma } from "@/src/backend/config/db";

type BlogLinkItem = {
  id: string;
  slug: string | null;
  title: string;
};

const INTERLINK_COUNT = 35;

export default async function BlogInterlinkCluster({ currentBlogId }: { currentBlogId: string }) {
  const prisma = getPrisma();
  const candidates = await prisma.blog.findMany({
    where: {
      status: "PUBLISHED",
      NOT: { id: currentBlogId },
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
    take: 300,
    orderBy: { published_at: "desc" },
  });

  const randomized = [...candidates];
  for (let i = randomized.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomized[i], randomized[j]] = [randomized[j], randomized[i]];
  }

  const links: BlogLinkItem[] = randomized.filter((item) => Boolean(item.slug)).slice(0, INTERLINK_COUNT);
  if (links.length === 0) return null;

  return (
    <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-2xl font-black tracking-tight text-[#0F172A] md:text-3xl">Explore More Medical Guides</h2>
      <p className="mt-2 text-sm font-medium text-gray-600">
        Related reading links are refreshed dynamically to strengthen internal SEO flow.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {links.map((item, idx) => (
          <Link
            key={item.id}
            href={`/blog/${item.slug}`}
            className="group rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50/40 hover:text-red-700"
          >
            <span className="mr-2 text-xs font-black uppercase tracking-wide text-red-600">#{idx + 1}</span>
            {item.title}
          </Link>
        ))}
      </div>
    </section>
  );
}

