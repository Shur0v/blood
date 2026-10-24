import { blogCanonical, blogDescription } from './blogSeo';

import { BLOG_FEED_PATH } from './blogArchive';
// Significant shared content removal: the full homepage no longer follows articles.
// Never replace this with the current build/request time.
const ARTICLE_TEMPLATE_UPDATED = new Date('2026-10-23T19:34:02Z');
export function blogPageLastModified(updated: Date) {
  return new Date(Math.max(updated.getTime(), ARTICLE_TEMPLATE_UPDATED.getTime()));
}
export function publicBlogUrl(post: {slug: string | null; canonical_url?: string | null}, base: string) {
  if (!post.slug?.trim()) return null;
  const own = new URL('/blog/' + encodeURIComponent(post.slug), base).href;
  return blogCanonical(post.slug, post.canonical_url, base) === own ? own : null;
}
const xml = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));
export type FeedArticle = {slug:string|null; canonical_url?:string|null; title:string; content:string; meta_description:string|null; published_at:Date|null; created_at:Date; updated_at:Date};
export function renderBlogFeed(posts: FeedArticle[], base: string) {
  const entries = posts.flatMap(post => {
    const url = publicBlogUrl(post, base);
    return url ? [{post,url}] : [];
  });
  const updated = new Date(Math.max(ARTICLE_TEMPLATE_UPDATED.getTime(), ...entries.map(({post})=>post.updated_at.getTime())));
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<id>${xml(base+'/blog')}</id><title>BloodNet Journal</title>
<link rel="self" href="${xml(base+BLOG_FEED_PATH)}"/><link rel="alternate" href="${xml(base+'/blog')}"/>
<updated>${updated.toISOString()}</updated><author><name>BloodNet Journal</name></author>
${entries.map(({post,url})=>`<entry><id>${xml(url)}</id><title>${xml(post.title)}</title><link rel="alternate" href="${xml(url)}"/><published>${(post.published_at||post.created_at).toISOString()}</published><updated>${blogPageLastModified(post.updated_at).toISOString()}</updated><summary>${xml(blogDescription(post.content,post.meta_description))}</summary></entry>`).join('\n')}
</feed>`;
}
