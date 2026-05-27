"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

type BlogListItem = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string;
  published_at: string | null;
  word_count: number;
  primary_keyword: string | null;
  author_type: "USER" | "ADMIN";
  is_anonymous: boolean;
  author_name?: string | null;
  author_city?: string | null;
  author_profile_image?: string | null;
};

const PAGE_LIMIT = 20;

export default function BlogListingClient({
  initialRows,
  initialTotal,
}: {
  initialRows: BlogListItem[];
  initialTotal: number;
}) {
  const [rows, setRows] = useState<BlogListItem[]>(initialRows);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasMore = useMemo(() => rows.length < total, [rows.length, total]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/public/blogs?page=${nextPage}&limit=${PAGE_LIMIT}&authorType=ALL`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) return;

      const incoming = (payload.data || []) as BlogListItem[];
      setRows((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const merged = [...prev];
        for (const item of incoming) {
          if (!seen.has(item.id)) merged.push(item);
        }
        return merged;
      });
      setPage(nextPage);
      setTotal(Number(payload?.pagination?.total || total));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {rows.map((post, index) => {
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
                  {post.title}
                </Link>
              </h2>

              <p className="mt-2 text-sm font-semibold text-gray-500">
                {post.published_at ? new Date(post.published_at).toLocaleDateString() : "Draft"}
              </p>

              {showAuthor && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={post.author_profile_image || "https://i.pravatar.cc/100?u=bloodnet-blog-author"}
                    alt={post.author_name || "Author"}
                    className="h-9 w-9 rounded-full border-2 border-white object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">{post.author_name || "BloodNet User"}</p>
                    {post.author_city && <p className="text-[11px] font-semibold text-gray-500">{post.author_city}</p>}
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
                {post.excerpt}
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

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded-xl bg-red-600 px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load More Blogs"}
          </button>
        </div>
      )}
    </>
  );
}

