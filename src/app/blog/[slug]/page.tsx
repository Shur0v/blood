import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getPrisma } from "@/src/backend/config/db";
import BlogTopNav from "@/src/components/BlogTopNav";
import BlogInterlinkCluster from "@/src/components/BlogInterlinkCluster";
import { DEFAULT_LOCALE, getRequestLocale } from "@/src/lib/locale";
import { translateTextCached } from "@/src/backend/services/translationService";
import BlogUnavailable from "@/src/components/BlogUnavailable";
import {cache} from 'react';
import {blogCanonical,blogDescription,prepareBlogReading} from '@/src/lib/blogSeo';
import {BLOG_FEED_PATH} from '@/src/lib/blogArchive';
import {getPublicBaseUrl} from '@/src/backend/config/env';

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

const getBlogBySlug = cache(async (slug: string) => {
  return getPrisma().blog.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });
});

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  let post: Awaited<ReturnType<typeof getBlogBySlug>>;
  try { post = await getBlogBySlug(slug); }
  catch { return { title: 'BloodNet Journal', robots: { index: false } }; }
  if (!post) {
    return { title: "Blog not found",robots:{index:false,follow:true} };
  }

  const title = post.meta_title || post.seo_title || post.title;
  const description = blogDescription(post.content,post.meta_description||post.seo_desc);
  const canonical = blogCanonical(post.slug!,post.canonical_url,getPublicBaseUrl());

  return {
    title,
    description,
    alternates: {
      canonical,
      types: {'application/atom+xml': BLOG_FEED_PATH},
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      publishedTime:(post.published_at||post.created_at).toISOString(),
      modifiedTime:post.updated_at.toISOString(),
      images:[{url:`/blog/${post.slug}/opengraph-image`,width:1200,height:630,alt:post.title}],
    },
    twitter:{card:'summary_large_image',title,description,images:[`/blog/${post.slug}/opengraph-image`]},
    robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-snippet':-1,'max-image-preview':'large'}},
  };
}

export default async function BlogDetailPage({ params }: BlogPageProps) {
  try { return await loadBlogDetail({params}); }
  catch (error) {
    // Preserve Next's real not-found/redirect control flow.
    if (error instanceof Error && 'digest' in error && String(error.digest).startsWith('NEXT_')) throw error;
    console.error('Blog article unavailable. Check server configuration and database connectivity.');
    return <BlogUnavailable />;
  }
}

async function loadBlogDetail({ params }: BlogPageProps) {
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


  const canonical = blogCanonical(post.slug!,post.canonical_url,getPublicBaseUrl());
  const reading=prepareBlogReading(localizedContent);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: localizedTitle,
    description: blogDescription(post.content,post.meta_description||post.seo_desc),
    url:canonical,
    inLanguage:locale,
    wordCount:reading.wordCount,
    image:new URL(`/blog/${post.slug}/opengraph-image`,getPublicBaseUrl()).href,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: canonical,
    keywords: [
      post.primary_keyword,
      ...(Array.isArray(post.secondary_keywords) ? post.secondary_keywords : []),
    ].filter(Boolean),
    author: {
      "@type": post.author_type==='USER'?'Person':'Organization',
      name: post.author_type==='USER'?(post.is_anonymous?'Anonymous contributor':author?.name||'BloodNet contributor'):'BloodNet editorial',
    },
    publisher: {
      "@type": "Organization",
      name: "BloodNet",
      url:getPublicBaseUrl(),
      logo:{'@type':'ImageObject',url:getPublicBaseUrl()+'/favicon.png'},
    },
  };



  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BlogTopNav />
      <main className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd,{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'BloodNet',item:getPublicBaseUrl()},{'@type':'ListItem',position:2,name:'Journal',item:getPublicBaseUrl()+'/blog'},{'@type':'ListItem',position:3,name:post.title,item:canonical}]}]).replace(/</g, "\\u003c") }} />

        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all articles
        </Link>

        <article lang={locale} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-600">
              BloodNet Journal
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
              <Clock3 className="h-3.5 w-3.5" />
              {reading.wordCount.toLocaleString('en-US')} words · {reading.readingMinutes} min read
            </span>
            <span className="text-xs font-semibold text-gray-500">
              Published <time dateTime={(post.published_at||post.created_at).toISOString()}>{(post.published_at||post.created_at).toISOString().slice(0,10)}</time> · Updated <time dateTime={post.updated_at.toISOString()}>{post.updated_at.toISOString().slice(0,10)}</time>
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A] md:text-5xl">{localizedTitle}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">{post.author_type==='USER'?'A community contribution':'Published by BloodNet editorial'}. Publication is not an individual medical assessment. Use the original sources and consult an appropriate qualified professional for personal medical decisions.</p>

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

          {!!reading.headings.length&&<nav aria-label="In this article" className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="font-semibold text-slate-900">In this article</h2><ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{reading.headings.map(heading=><li key={heading.id} className={heading.level===3?'pl-4':''}><a href={`#${heading.id}`} className="text-rose-700 underline underline-offset-4">{heading.title}</a></li>)}</ol></nav>}
          {(
            <div
              className="blog-html-content mt-8 text-[17px] leading-8 text-slate-700 md:text-[19px] md:leading-9 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[#0F172A] [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#0F172A] [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:font-semibold [&_a]:text-red-600 [&_blockquote]:mt-6 [&_blockquote]:border-l-4 [&_blockquote]:border-red-200 [&_blockquote]:bg-red-50/40 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_table]:min-w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_.bn-table-wrap]:my-6 [&_.bn-table-wrap]:w-full [&_.bn-table-wrap]:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: reading.html }}
            />
          )}
        </article>

        <BlogInterlinkCluster currentBlogId={post.id} />
      </main>
    </div>
  );
}
