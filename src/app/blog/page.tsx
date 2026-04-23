import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { getPrisma } from "@/src/backend/config/db";
import BlogTopNav from "@/src/components/BlogTopNav";
import { DEFAULT_LOCALE, getRequestLocale } from "@/src/lib/locale";
import { translateTextCached } from "@/src/backend/services/translationService";

export const dynamic = "force-dynamic";

export default async function BlogListingPage() {
  const prisma = getPrisma();
  const locale = await getRequestLocale();

  const rows = await prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { published_at: "desc" },
    take: 24,
    select: {
      id: true,
      title: true,
      slug: true,
      meta_description: true,
      content: true,
      published_at: true,
      word_count: true,
      primary_keyword: true,
      author_id: true,
      author_type: true,
      is_anonymous: true,
    },
  });

  const userIds = [...new Set(rows.filter((row) => row.author_type === "USER").map((row) => row.author_id))];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, profile_image_url: true, location_city: true },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  const heroTitle =
    locale !== DEFAULT_LOCALE
      ? await translateTextCached({
          prisma,
          sourceText: "Medical Insights For Safer Blood And Organ Support",
          locale,
          contentType: "blog-hero:title",
        })
      : "Medical Insights For Safer Blood And Organ Support";
  const heroDesc =
    locale !== DEFAULT_LOCALE
      ? await translateTextCached({
          prisma,
          sourceText:
            "Long-form, text-only articles focused on emergency donor response, recipient safety, and real-world care workflows.",
          locale,
          contentType: "blog-hero:desc",
        })
      : "Long-form, text-only articles focused on emergency donor response, recipient safety, and real-world care workflows.";

  const localizedRows = await Promise.all(
    rows.map(async (row) => {
      if (locale === DEFAULT_LOCALE) {
        return { ...row, localizedTitle: row.title, localizedExcerpt: row.meta_description || `${row.content.slice(0, 220)}...` };
      }
      const [localizedTitle, localizedExcerpt] = await Promise.all([
        translateTextCached({
          prisma,
          sourceText: row.title,
          locale,
          contentType: "blog-list:title",
          contentVersion: row.id,
        }),
        translateTextCached({
          prisma,
          sourceText: row.meta_description || `${row.content.slice(0, 220)}...`,
          locale,
          contentType: "blog-list:excerpt",
          contentVersion: row.id,
        }),
      ]);
      return { ...row, localizedTitle, localizedExcerpt };
    }),
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BlogTopNav />
      <main className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-r from-white via-red-50/40 to-white p-6 shadow-sm md:p-10">
          <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-red-200/20 blur-3xl" />
          <p className="mb-3 inline-flex rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-600">
            BloodNet Journal
          </p>
          <h1 className="max-w-4xl text-3xl font-black tracking-tight text-[#0F172A] md:text-5xl">
            {heroTitle}
          </h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-slate-600 md:text-lg">
            {heroDesc}
          </p>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {localizedRows.map((post, index) => {
            const author = userMap.get(post.author_id);
            const showAuthor = post.author_type === "USER" && !post.is_anonymous;
            return (
              <article
                key={post.id}
                className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-600">
                    Article #{index + 1}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {post.word_count} words
                  </span>
                </div>

                <h2 className="text-2xl font-black leading-snug text-[#0F172A]">
                  <Link href={`/blog/${post.slug}`} className="transition group-hover:text-red-600">
                    {post.localizedTitle}
                  </Link>
                </h2>

                <p className="mt-2 text-sm font-semibold text-gray-500">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : "Draft"}
                </p>

                {showAuthor && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={author?.profile_image_url || "https://i.pravatar.cc/100?u=bloodnet-blog-author"}
                      alt={author?.name || "Author"}
                      className="h-9 w-9 rounded-full border-2 border-white object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{author?.name || "BloodNet User"}</p>
                      {author?.location_city && <p className="text-[11px] font-semibold text-gray-500">{author.location_city}</p>}
                    </div>
                  </div>
                )}

                {post.author_type === "USER" && post.is_anonymous && (
                  <p className="mt-3 inline-flex w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                    Anonymous Story
                  </p>
                )}

                {post.primary_keyword && (
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-red-600">
                    Focus keyword: {post.primary_keyword}
                  </p>
                )}

                <p className="mt-4 flex-1 text-base leading-relaxed text-slate-700">
                  {post.localizedExcerpt}
                </p>

                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-red-600 transition group-hover:gap-3"
                >
                  Read full article
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
