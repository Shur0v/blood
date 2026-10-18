import { getPrisma } from "@/src/backend/config/db";
import BlogTopNav from "@/src/components/BlogTopNav";
import { DEFAULT_LOCALE, getRequestLocale } from "@/src/lib/locale";
import { translateTextCached } from "@/src/backend/services/translationService";
import { stripHtmlTags } from "@/src/lib/blogContent";
import BlogListingClient from "@/src/components/BlogListingClient";
import BlogUnavailable from "@/src/components/BlogUnavailable";
import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {archivePage} from '@/src/lib/blogSeo';
type ArchiveProps={searchParams:Promise<{page?:string}>};
export async function generateMetadata({searchParams}:ArchiveProps):Promise<Metadata>{const page=archivePage((await searchParams).page);return {title:`BloodNet Journal — Blood Donation & Health Articles${page>1?` — Page ${page}`:''}`,description:'Read BloodNet articles about blood donation, donor coordination, organ support and health. Browse the complete published article archive.',alternates:{canonical:page>1?`/blog?page=${page}`:'/blog'},openGraph:{type:'website',url:page>1?`/blog?page=${page}`:'/blog'}};}

export const dynamic = "force-dynamic";

type BlogClientRow = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string;
  published_at: string | null;
  word_count: number;
  primary_keyword: string | null;
  author_type: "USER" | "ADMIN";
  is_anonymous: boolean;
  author_name: string;
  author_city: string | null;
  author_profile_image: string | null;
};

export default async function BlogListingPage(props:ArchiveProps) {
  try { return await loadBlogListing(archivePage((await props.searchParams).page)); }
  catch(error) {
    if(error instanceof Error&&'digest' in error&&String(error.digest).startsWith('NEXT_'))throw error;
    console.error('Blog listing unavailable. Check server configuration and database connectivity.');
    return <BlogUnavailable />;
  }
}

async function loadBlogListing(page:number) {
  const prisma = getPrisma();
  const locale = await getRequestLocale();

  const [rows, total] = await Promise.all([
    prisma.blog.findMany({
      where: { status: "PUBLISHED",slug:{not:null} },
      orderBy: [{ published_at: "desc" },{id:'desc'}],
      skip:(page-1)*20,
      take: 20,
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
    }),
    prisma.blog.count({ where: { status: "PUBLISHED",slug:{not:null} } }),
  ]);
  const pages=Math.max(1,Math.ceil(total/20));if(page>pages)notFound();

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
        const plainContent = stripHtmlTags(row.content);
        return {
          ...row,
          localizedTitle: row.title,
          localizedExcerpt: row.meta_description || `${plainContent.slice(0, 220)}...`,
        };
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
          sourceText: row.meta_description || `${stripHtmlTags(row.content).slice(0, 220)}...`,
          locale,
          contentType: "blog-list:excerpt",
          contentVersion: row.id,
        }),
      ]);
      return { ...row, localizedTitle, localizedExcerpt };
    }),
  );

  const initialClientRows: BlogClientRow[] = localizedRows.map((post) => ({
    id: post.id,
    title: post.localizedTitle,
    slug: post.slug,
    excerpt: post.localizedExcerpt,
    published_at: post.published_at ? String(post.published_at) : null,
    word_count: post.word_count,
    primary_keyword: post.primary_keyword ?? null,
    author_type: post.author_type === "USER" ? "USER" : "ADMIN",
    is_anonymous: post.is_anonymous,
    author_name:
      post.author_type === "USER"
        ? post.is_anonymous
          ? "Anonymous"
          : userMap.get(post.author_id)?.name || "BloodNet User"
        : "BloodNet Editorial",
    author_city: post.author_type === "USER" && !post.is_anonymous ? userMap.get(post.author_id)?.location_city || null : null,
    author_profile_image:
      post.author_type === "USER" && !post.is_anonymous ? userMap.get(post.author_id)?.profile_image_url || null : null,
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BlogTopNav />
      <main className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-r from-white via-red-50/40 to-white p-6 shadow-sm md:p-10">
          <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-red-200/20 blur-3xl" />
          <p className="mb-3 inline-flex rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-600">
            BloodNet Journal
          </p>
          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-[#0F172A] md:text-5xl">{heroTitle}</h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-slate-600 md:text-lg">{heroDesc}</p>
        </section>

        <BlogListingClient key={page} initialRows={initialClientRows} initialTotal={total} initialPage={page}/>
        <nav aria-label="Article archive pages" className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm">{page>1&&<Link rel="prev" href={page===2?'/blog':`/blog?page=${page-1}`} className="rounded-xl border bg-white px-4 py-3">Previous</Link>}{Array.from({length:pages},(_,i)=>i+1).filter(p=>p===1||p===pages||Math.abs(p-page)<=2).map(p=><Link key={p} href={p===1?'/blog':`/blog?page=${p}`} aria-current={page===p?'page':undefined} className={`rounded-xl border px-4 py-3 ${p===page?'bg-rose-700 text-white':'bg-white text-slate-700'}`}>{p}</Link>)}{page<pages&&<Link rel="next" href={`/blog?page=${page+1}`} className="rounded-xl border bg-white px-4 py-3">Next</Link>}</nav>
      </main>
    </div>
  );
}

