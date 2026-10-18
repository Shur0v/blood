import {relatedBlogScore} from '@/src/lib/blogSeo';
import Link from "next/link";
import { getPrisma } from "@/src/backend/config/db";

type BlogLinkItem = {
  id: string;
  slug: string | null;
  title: string;
};

const INTERLINK_COUNT = 8;

export default async function BlogInterlinkCluster({ currentBlogId }: { currentBlogId: string }) {
  const prisma = getPrisma();
  const current=await prisma.blog.findUnique({where:{id:currentBlogId},select:{title:true,primary_keyword:true}});
  const query=[current?.title,current?.primary_keyword].filter(Boolean).join(' ');
  const candidates = await prisma.blog.findMany({
    where: {
      status: "PUBLISHED",slug:{not:null},
      NOT: { id: currentBlogId },
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
    take: 2000,
    orderBy: [{ published_at: "desc" },{id:"desc"}],
  });

  const links: BlogLinkItem[] = [...candidates].sort((a,b)=>relatedBlogScore(query,b.title)-relatedBlogScore(query,a.title)).slice(0,INTERLINK_COUNT);
  if (links.length === 0) return null;

  return (
    <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-2xl font-semibold tracking-tight text-[#0F172A] md:text-3xl">Explore More Medical Guides</h2>
      <p className="mt-2 text-sm font-medium text-gray-600">
        Continue with related topics from the BloodNet journal.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {links.map((item, idx) => (
          <Link
            key={item.id}
            href={`/blog/${item.slug}`}
            className="group rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50/40 hover:text-red-700"
          >
            <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-red-600">#{idx + 1}</span>
            {item.title}
          </Link>
        ))}
      </div>
    </section>
  );
}

