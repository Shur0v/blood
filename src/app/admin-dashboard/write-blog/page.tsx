'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';

type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface BlogItem {
  id: string;
  title: string;
  content: string;
  slug: string | null;
  status: BlogStatus;
  word_count: number;
  updated_at: string;
  canonical_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  primary_keyword?: string | null;
  secondary_keywords?: string[] | null;
}
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const MIN_WORD_COUNT_DEFAULT = 1200;

const BLOG_PROMPT_TEMPLATE = `You are a professional medical SEO writer for BloodNet.

TASK:
Write a long-form blog article in clean semantic HTML (NOT markdown, NOT ASCII diagrams).

OUTPUT RULES (VERY IMPORTANT):
1) Return only article-body HTML. No <html>, <head>, <body>, scripts, iframes, or inline JS.
2) Use only safe semantic tags: h2, h3, p, ul, ol, li, strong, em, blockquote, a, table, thead, tbody, tr, th, td, hr.
3) Keep all sections human-written, practical, and medically careful.
4) Do not use fake statistics, do not claim diagnosis, and include a safety note to consult licensed doctors.
5) Minimum length: 1400+ words unless instructed otherwise.

RESPONSIVE TABLE/DIAGRAM RULE:
If you include any table/comparison/chart-like structure, wrap each table exactly like this:
<div style="overflow-x:auto;max-width:100%;">
  <table>
    ...
  </table>
</div>

CONTENT STRUCTURE:
- Intro hook (problem + who this is for)
- Clear explanation sections with H2/H3
- Practical checklists / bullet points
- Real-life scenario examples
- Common mistakes section
- FAQ section (3-5 short Q&A)
- Safety disclaimer
- Conclusion with actionable next step

SEO RULES:
- Natural use of primary keyword in title intro and one subheading
- Use secondary keywords naturally (no stuffing)
- Short paragraphs for mobile readability
- Use plain, clear language

Now write the article for this topic:
[PASTE TOPIC HERE]
Primary keyword:
[PASTE PRIMARY KEYWORD]
Secondary keywords:
[PASTE SECONDARY KEYWORDS]`;

const countWords = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;

export default function WriteBlogPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [status, setStatus] = useState<BlogStatus>('DRAFT');
  const [minWordCount, setMinWordCount] = useState(MIN_WORD_COUNT_DEFAULT);
  const [rows, setRows] = useState<BlogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [message, setMessage] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const wordCount = useMemo(() => countWords(content), [content]);

  const loadBlogs = async (targetPage: number = 1) => {
    setLoadingTable(true);
    const res = await fetch(`/api/admin/blogs?page=${targetPage}&limit=20`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
    const payload = await res.json();
    if (!res.ok || !payload.success) {
      setRows([]);
      setLoadingTable(false);
      return;
    }
    setRows(payload.data || []);
    setPage(Number(payload?.pagination?.page || targetPage));
    setPagination({
      page: Number(payload?.pagination?.page || targetPage),
      limit: Number(payload?.pagination?.limit || 20),
      total: Number(payload?.pagination?.total || 0),
      totalPages: Number(payload?.pagination?.totalPages || 1),
    });
    setLoadingTable(false);
  };

  useEffect(() => {
    void loadBlogs();
  }, []);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSlug('');
    setMetaTitle('');
    setMetaDescription('');
    setCanonicalUrl('');
    setPrimaryKeyword('');
    setSecondaryKeywords('');
    setStatus('DRAFT');
    setEditingId(null);
  };

  const saveBlog = async (nextStatus?: BlogStatus) => {
    setSaving(true);
    setMessage('');
    const payload = {
      title,
      content,
      status: nextStatus || status,
      slug: slug || undefined,
      canonicalUrl: canonicalUrl || undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      primaryKeyword: primaryKeyword || undefined,
      secondaryKeywords: secondaryKeywords
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      minWordCount,
    };

    const url = editingId ? `/api/admin/blogs/${editingId}` : '/api/admin/blogs';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    setMessage(json.message || (json.success ? 'Saved successfully.' : 'Failed to save.'));
    if (!res.ok || !json.success) return;

    resetForm();
    await loadBlogs(page);
  };

  const startEdit = async (item: BlogItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content || '');
    setSlug(item.slug || '');
    setStatus(item.status);
    setMetaTitle(item.meta_title || '');
    setMetaDescription(item.meta_description || '');
    setCanonicalUrl(item.canonical_url || '');
    setPrimaryKeyword(item.primary_keyword || '');
    setSecondaryKeywords(Array.isArray(item.secondary_keywords) ? item.secondary_keywords.join(', ') : '');
  };

  const copyPromptTemplate = async () => {
    try {
      await navigator.clipboard.writeText(BLOG_PROMPT_TEMPLATE);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      setMessage('Could not copy prompt automatically. Please copy manually.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-2xl font-bold">Content Editor (CMS)</h2>
        <p className="text-sm text-gray-500 mt-1">HTML-ready SEO blog publishing with responsive rendering support.</p>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-500">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card title="Gemini Prompt Template (Copy & Use)">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500">
                Use this prompt in Gemini to generate mobile-safe, structured article HTML for this editor.
              </p>
              <textarea
                value={BLOG_PROMPT_TEMPLATE}
                readOnly
                rows={14}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] px-4 py-3 text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => void copyPromptTemplate()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white"
              >
                {copyState === 'copied' ? 'Copied' : 'Copy Prompt Template'}
              </button>
            </div>
          </Card>

          <Card title="Article Content">
            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] px-4 py-3 text-lg font-bold outline-none"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste full article HTML (recommended) or plain text..."
                rows={16}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] px-4 py-3 text-sm outline-none resize-y"
              />
            </div>
          </Card>

          <Card title="SEO Metadata">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug (optional)" className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] px-4 py-2.5 text-sm outline-none" />
              <input value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="Canonical URL (optional)" className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] px-4 py-2.5 text-sm outline-none" />
              <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Meta title" className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] px-4 py-2.5 text-sm outline-none" />
              <input value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} placeholder="Primary keyword" className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] px-4 py-2.5 text-sm outline-none" />
              <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} placeholder="Meta description" className="md:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] px-4 py-2.5 text-sm outline-none resize-none" />
              <input value={secondaryKeywords} onChange={(e) => setSecondaryKeywords(e.target.value)} placeholder="Secondary keywords (comma separated)" className="md:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] px-4 py-2.5 text-sm outline-none" />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card title="Publish Panel">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Word Count</span>
                <span className="font-bold">{wordCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Minimum to publish</span>
                <input
                  type="number"
                  value={minWordCount}
                  min={300}
                  max={3000}
                  onChange={(e) => setMinWordCount(Number(e.target.value || MIN_WORD_COUNT_DEFAULT))}
                  className="w-20 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] px-2 py-1 text-right text-sm"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as BlogStatus)} className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] px-2 py-1 text-sm">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => void saveBlog('DRAFT')}
                className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 py-2 text-sm font-bold"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveBlog('PUBLISHED')}
                className="w-full rounded-lg bg-red-600 py-2 text-sm font-bold text-white"
              >
                Publish Now
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 py-2 text-xs font-bold">
                  Cancel Edit
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card title="Published & Draft Content">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-sm font-semibold text-gray-500">
            Total blogs: <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.total}</span>
          </p>
          <p className="text-xs font-semibold text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
        <Table headers={['Title', 'Slug', 'Status', 'Words', 'Updated', 'Actions']}>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-semibold">{row.title}</TableCell>
              <TableCell>{row.slug || 'N/A'}</TableCell>
              <TableCell>
                <Badge type={row.status === 'PUBLISHED' ? 'success' : row.status === 'ARCHIVED' ? 'danger' : 'warning'}>
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell>{row.word_count}</TableCell>
              <TableCell>{new Date(row.updated_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <button onClick={() => void startEdit(row)} className="text-sm font-bold text-blue-500">
                  Edit
                </button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        {loadingTable && (
          <p className="mt-3 text-center text-xs font-semibold text-gray-500">Loading blogs...</p>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loadingTable}
            onClick={() => void loadBlogs(page - 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
          >
            Previous
          </button>
          {Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1)
            .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pagination.totalPages)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showGap = idx > 0 && prev !== undefined && p - prev > 1;
              return (
                <React.Fragment key={`p-${p}`}>
                  {showGap && <span className="px-1 text-xs text-gray-500">...</span>}
                  <button
                    type="button"
                    onClick={() => void loadBlogs(p)}
                    disabled={loadingTable}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      p === page
                        ? 'bg-red-600 text-white'
                        : 'border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}
          <button
            type="button"
            disabled={page >= pagination.totalPages || loadingTable}
            onClick={() => void loadBlogs(page + 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
          >
            Next
          </button>
        </div>
      </Card>
    </div>
  );
}
