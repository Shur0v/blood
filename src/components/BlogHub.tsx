import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, HeartPulse, Share2, UserRound } from "lucide-react";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  coverImage: string;
  author: string;
  content: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "safe-blood-donation-guide",
    title: "Safe Blood Donation Guide: Steps Every Donor Should Know",
    excerpt:
      "A practical guide for first-time and returning donors covering preparation, safety checks, and post-donation recovery.",
    category: "Donor Safety",
    readTime: "6 min read",
    publishedAt: "April 22, 2026",
    coverImage:
      "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1400&q=80",
    author: "BloodNet Medical Desk",
    content: [
      "Blood donation is a life-saving act, but donor safety always comes first. Before donating, ensure you are hydrated, rested, and have eaten a light meal. Avoid heavy-fat meals right before donation to help improve blood quality checks.",
      "During screening, answer all health questions honestly. These checks protect both donor and recipient. If you have recent illness, surgery, or medication history, let the medical team decide your eligibility.",
      "After donation, rest for a few minutes, drink fluids, and avoid heavy physical activity for the rest of the day. If dizziness or weakness continues, contact a healthcare professional immediately.",
    ],
  },
  {
    slug: "ethical-organ-matching-policy",
    title: "Ethical Organ Matching Policy: Free Donation and Legal Compliance",
    excerpt:
      "How BloodNet enforces ethical matching rules, free donation principles, and zero tolerance for organ trade.",
    category: "Policy & Ethics",
    readTime: "5 min read",
    publishedAt: "April 21, 2026",
    coverImage:
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1400&q=80",
    author: "Trust & Compliance Team",
    content: [
      "BloodNet is strictly a donor-recipient matching platform. Organ selling, brokering, or financial exchange for organs is illegal and prohibited. Every user must follow legal and ethical donation standards.",
      "We support voluntary, free donation only. Any attempt to request or offer payment for organs results in immediate enforcement action, including account suspension and escalation where required by law.",
      "Our moderation layers review suspicious activity, and users can report abuse from the platform. Safety, legality, and transparency are core principles of all matching workflows.",
    ],
  },
  {
    slug: "anti-scam-transport-rule",
    title: "Anti-Scam Transport Rule: Pay Only After Physical Hospital Arrival",
    excerpt:
      "A clear explanation of transportation support rules that help protect recipients from fraud and fake donor requests.",
    category: "Community Safety",
    readTime: "4 min read",
    publishedAt: "April 20, 2026",
    coverImage:
      "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1400&q=80",
    author: "Community Guardian Unit",
    content: [
      "In urgent blood scenarios, recipients may choose to cover donor transportation costs. This is optional support, not a donation fee. BloodNet does not allow any payment for blood or organs.",
      "Critical anti-scam rule: never transfer money before the donor physically arrives at the agreed hospital or verified medical location. This policy protects recipients from impersonation and advance-payment scams.",
      "Always confirm donor identity through official communication and hospital verification steps. If you detect unusual pressure, report immediately through the platform reporting channel.",
    ],
  },
];

type BlogHubProps = {
  onOpenPost: (slug: string) => void;
};

export function BlogHub({ onOpenPost }: BlogHubProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 pb-28">
      <div className="overflow-hidden rounded-3xl border border-gray-200/70 bg-gradient-to-br from-white via-rose-50/30 to-red-100/30 p-8 md:p-12 shadow-[0_30px_70px_rgba(15,23,42,0.10)]">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-primary-dark">Editorial</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 md:text-6xl">BloodNet Journal</h1>
        <p className="mt-4 max-w-2xl text-base text-gray-600 md:text-lg">
          Modern donor intelligence, safety insights, and community-first medical guidance.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {BLOG_POSTS.map((post, idx) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-900">
                  {post.category}
                </span>
              </div>
              <div className="p-5">
                <h2 className="text-xl font-black leading-tight text-gray-900">{post.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" /> {post.publishedAt}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" /> {post.readTime}
                  </span>
                </div>
                <button
                  onClick={() => onOpenPost(post.slug)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
                >
                  Read full article <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

type BlogDetailProps = {
  slug: string;
  onBack: () => void;
};

export function BlogDetail({ slug, onBack }: BlogDetailProps) {
  const post = BLOG_POSTS.find((item) => item.slug === slug);

  if (!post) {
    return (
      <section className="mx-auto max-w-4xl px-4 pt-24 pb-28">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <h2 className="text-2xl font-black text-gray-900">Article Not Found</h2>
          <p className="mt-2 text-gray-600">This blog page does not exist or may have been removed.</p>
          <button
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 pt-24 pb-28">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Blog
      </button>

      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
        <div className="relative h-72 md:h-96">
          <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide backdrop-blur">
              {post.category}
            </span>
            <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{post.title}</h1>
          </div>
        </div>

        <div className="p-6 md:p-10">
          <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-4 w-4" /> {post.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {post.publishedAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" /> {post.readTime}
            </span>
          </div>

          <div className="space-y-5 text-[17px] leading-8 text-gray-700">
            {post.content.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-gray-200 pt-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700">
              <HeartPulse className="h-3.5 w-3.5" /> Donor Education
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700">
              <Share2 className="h-3.5 w-3.5" /> Community Safety
            </span>
          </div>
        </div>
      </article>
    </section>
  );
}
