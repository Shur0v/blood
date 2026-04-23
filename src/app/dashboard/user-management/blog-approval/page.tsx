'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/src/dashboard/user-management/components/Card';
import { Modal } from '@/src/dashboard/user-management/components/Modal';
import { Pagination } from '@/src/dashboard/user-management/components/Pagination';
import { BookOpen, Check, Search, Trash2, X } from 'lucide-react';

type BlogStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'DRAFT';

interface BlogItem {
  id: string;
  title: string;
  author: string;
  date: string;
  status: BlogStatus;
  preview: string;
  content: string;
  seoOptimized: boolean;
}

const PAGE_SIZE = 20;

const normalizeBlogStatus = (status: string): BlogStatus => {
  if (status === 'APPROVED' || status === 'REJECTED' || status === 'PUBLISHED' || status === 'DRAFT') {
    return status;
  }
  return 'PENDING';
};

const isPending = (status: BlogStatus) => status === 'PENDING' || status === 'DRAFT';

export default function BlogApprovalPage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<BlogItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const loadBlogs = async (page: number, status: string, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (status) {
        params.set('status', status);
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }
      const res = await fetch(`/api/management/blog-approvals?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();

      if (!res.ok || !payload.success) {
        setBlogs([]);
        setTotalPages(1);
        setTotalItems(0);
        setPendingCount(0);
        return;
      }

      const mapped: BlogItem[] = payload.data.map((blog: any) => ({
        id: blog.id,
        title: blog.title,
        author: blog.author_name || blog.author_id || 'Unknown',
        date: new Date(blog.created_at).toLocaleDateString(),
        status: normalizeBlogStatus(blog.status),
        preview: (blog.content || '').slice(0, 180),
        content: blog.content || '',
        seoOptimized: Boolean(blog.seo_title || blog.seo_desc),
      }));

      setBlogs(mapped);
      setTotalPages(payload.pagination?.totalPages || 1);
      setTotalItems(payload.pagination?.total || 0);
      setPendingCount(payload.meta?.pendingCount || 0);
    } catch {
      setBlogs([]);
      setTotalPages(1);
      setTotalItems(0);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    void loadBlogs(currentPage, statusFilter, search);
  }, [currentPage, statusFilter, search]);

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    const finalStatus = action === 'APPROVED' ? 'PUBLISHED' : 'REJECTED';
    const res = await fetch('/api/management/blog-approvals', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: finalStatus }),
    });

    if (!res.ok) return;

    setBlogs((prev) =>
      prev.map((blog) =>
        blog.id === id
          ? {
              ...blog,
              status: finalStatus as BlogStatus,
            }
          : blog,
      ),
    );
    setPendingCount((prev) => Math.max(0, prev - 1));
    if (selectedBlog?.id === id) {
      setSelectedBlog({
        ...selectedBlog,
        status: finalStatus as BlogStatus,
      });
      setIsModalOpen(false);
    }
  };

  const pendingBlogs = useMemo(() => blogs.filter((b) => isPending(b.status)), [blogs]);
  const otherBlogs = useMemo(() => blogs.filter((b) => !isPending(b.status)), [blogs]);

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/management/blog-approvals', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return;
    setBlogs((prev) => prev.filter((blog) => blog.id !== id));
    setTotalItems((prev) => Math.max(0, prev - 1));
    if (selectedBlog?.id === id) {
      setIsModalOpen(false);
      setSelectedBlog(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Blog Moderation</h2>
          <p className="text-[var(--text-muted)] text-sm">Review, approve, and reject user-submitted stories.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)]/20 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, author, content..."
            className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setCurrentPage(1);
            setStatusFilter(e.target.value);
          }}
          className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PUBLISHED">Published</option>
          <option value="REJECTED">Rejected</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
          <BookOpen className="text-[var(--primary)]" />
          Pending Reviews ({pendingCount})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingBlogs.map((blog) => (
            <Card key={blog.id} className="flex flex-col p-0 overflow-hidden">
              <div className="h-32 bg-gray-100 dark:bg-gray-800 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  {blog.seoOptimized && (
                    <span className="bg-[var(--primary)] text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md shadow-sm">
                      SEO Optimized Content
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h4 className="font-bold text-lg text-[var(--text-main)] mb-1 line-clamp-1">{blog.title}</h4>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-3">
                  <span>By {blog.author}</span>
                  <span>{blog.date}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-6 flex-1">{blog.preview || 'No preview available.'}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedBlog(blog);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 py-2 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-sm font-medium hover:bg-[var(--primary-glow)] transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => void handleAction(blog.id, 'APPROVED')}
                    className="w-10 h-10 flex items-center justify-center bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500/20 transition-colors"
                    title="Approve"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => void handleAction(blog.id, 'REJECTED')}
                    className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-colors"
                    title="Reject"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {!loading && pendingBlogs.length === 0 && (
            <Card className="p-6 text-sm text-[var(--text-muted)]">No pending blog requests found on this page.</Card>
          )}
        </div>
      </div>

      {otherBlogs.length > 0 && (
        <div className="mt-8 pt-8 border-t border-[var(--border-main)]">
          <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4">Recently Processed</h3>
          <div className="space-y-4">
            {otherBlogs.map((blog) => (
              <div key={blog.id} className="flex items-center justify-between p-4 glass rounded-xl border border-[var(--border-main)]">
                <div>
                  <h4 className="font-medium text-[var(--text-main)]">{blog.title}</h4>
                  <p className="text-xs text-[var(--text-muted)]">By {blog.author} • {blog.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${blog.status === 'REJECTED' ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}`}>
                    {blog.status}
                  </span>
                  <button
                    onClick={() => void handleDelete(blog.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 transition hover:bg-red-500/20"
                    title="Delete blog"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Blog Preview">
        {selectedBlog && (
          <div className="space-y-6">
            <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <span className="text-gray-400 font-medium">Text-only story preview</span>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-2 text-[var(--text-main)]">{selectedBlog.title}</h2>
              <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                <span className="font-medium text-[var(--primary)]">{selectedBlog.author}</span>
                <span>•</span>
                <span>{selectedBlog.date}</span>
                {selectedBlog.seoOptimized && (
                  <>
                    <span>•</span>
                    <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded text-xs font-bold">SEO Ready</span>
                  </>
                )}
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none text-[var(--text-main)]">
              <p className="text-lg leading-relaxed">{selectedBlog.preview || 'No preview available.'}</p>
              <br />
              <p className="text-gray-400 italic">{selectedBlog.content || '[No content provided]'}</p>
            </div>

            {isPending(selectedBlog.status) && (
              <div className="flex gap-4 pt-6 border-t border-[var(--border-main)]">
                <button
                  onClick={() => void handleAction(selectedBlog.id, 'APPROVED')}
                  className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Check size={20} /> Approve & Publish
                </button>
                <button
                  onClick={() => void handleAction(selectedBlog.id, 'REJECTED')}
                  className="flex-1 bg-[var(--bg-app)] border border-[var(--border-main)] hover:bg-red-50 hover:text-red-600 text-[var(--text-main)] py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X size={20} /> Reject Story
                </button>
              </div>
            )}
            {!isPending(selectedBlog.status) && (
              <div className="pt-6 border-t border-[var(--border-main)]">
                <button
                  onClick={() => void handleDelete(selectedBlog.id)}
                  className="w-full rounded-xl bg-red-500/10 py-3 text-sm font-bold text-red-600 transition hover:bg-red-500/20"
                >
                  Delete This Blog
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
