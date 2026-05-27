import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getPrisma } from "@/src/backend/config/db";
import BlogTopNav from "@/src/components/BlogTopNav";
import BlogInterlinkCluster from "@/src/components/BlogInterlinkCluster";
import { DEFAULT_LOCALE, getRequestLocale } from "@/src/lib/locale";
import { translateTextCached } from "@/src/backend/services/translationService";
import { hasHtmlMarkup, sanitizeBlogHtml, stripHtmlTags } from "@/src/lib/blogContent";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

const getBlogBySlug = async (slug: string) => {
  return getPrisma().blog.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });
};

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) {
    return { title: "Blog not found" };
  }

  const title = post.meta_title || post.seo_title || post.title;
  const description = post.meta_description || post.seo_desc || stripHtmlTags(post.content).slice(0, 160);
  const canonical = post.canonical_url || `/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
    },
  };
}

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const prisma = getPrisma();
  const post = await getBlogBySlug(slug);
  if (!post) notFound();
  const author =
    post.author_type === "USER"
      ? await prisma.user.findUnique({
          where: { id: post.author_id },
          select: { name: true, profile_image_url: true, location_city: true },
        })
      : null;

  const localizedTitle =
    locale !== DEFAULT_LOCALE
      ? await translateTextCached({
          prisma,
          sourceText: post.title,
          locale,
          contentType: "blog-detail:title",
          contentVersion: post.id,
        })
      : post.title;
  const localizedContent =
    locale !== DEFAULT_LOCALE
      ? await translateTextCached({
          prisma,
          sourceText: post.content,
          locale,
          contentType: "blog-detail:content",
          contentVersion: post.id,
        })
      : post.content;

  const paragraphs = localizedContent
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const canonical = post.canonical_url || `/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.meta_title || post.seo_title || post.title,
    description: post.meta_description || post.seo_desc || stripHtmlTags(post.content).slice(0, 160),
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: canonical,
    keywords: [
      post.primary_keyword,
      ...(Array.isArray(post.secondary_keywords) ? post.secondary_keywords : []),
    ].filter(Boolean),
    author: {
      "@type": "Organization",
      name: "BloodNet",
    },
    publisher: {
      "@type": "Organization",
      name: "BloodNet",
    },
  };

  const isHtmlContent = hasHtmlMarkup(localizedContent);
  const safeHtml = isHtmlContent ? sanitizeBlogHtml(localizedContent) : "";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BlogTopNav />
      <main className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all articles
        </Link>

        <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-600">
              BloodNet Journal
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
              <Clock3 className="h-3.5 w-3.5" />
              {post.word_count} words
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {post.published_at ? new Date(post.published_at).toLocaleDateString() : "Draft"}
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[#0F172A] md:text-5xl">{localizedTitle}</h1>

          {post.primary_keyword && (
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-red-600">
              Primary keyword: {post.primary_keyword}
            </p>
          )}

          {post.author_type === "USER" && !post.is_anonymous && author && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <img
                src={author.profile_image_url || "https://i.pravatar.cc/120?u=bloodnet-writer"}
                alt={author.name}
                className="h-11 w-11 rounded-full border-2 border-white object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-sm font-bold text-[#0F172A]">{author.name}</p>
                {author.location_city && <p className="text-xs font-semibold text-gray-500">{author.location_city}</p>}
              </div>
            </div>
          )}

          {post.author_type === "USER" && post.is_anonymous && (
            <div className="mt-6 inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
              Anonymous Story
            </div>
          )}

          {isHtmlContent ? (
            <div
              className="blog-html-content mt-8 text-[17px] leading-8 text-slate-700 md:text-[19px] md:leading-9 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-[#0F172A] [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#0F172A] [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:font-semibold [&_a]:text-red-600 [&_blockquote]:mt-6 [&_blockquote]:border-l-4 [&_blockquote]:border-red-200 [&_blockquote]:bg-red-50/40 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_table]:min-w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_.bn-table-wrap]:my-6 [&_.bn-table-wrap]:w-full [&_.bn-table-wrap]:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          ) : (
            <div className="mt-8 space-y-6 text-[17px] leading-8 text-slate-700 md:text-[19px] md:leading-9">
              {paragraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          )}
        </article>

        <BlogInterlinkCluster currentBlogId={post.id} />
      </main>
    </div>
  );
}
