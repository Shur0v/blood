'use client';

import React, { useState } from 'react';
import { Card } from '@/src/dashboard/user-management/components/Card';
import { Modal } from '@/src/dashboard/user-management/components/Modal';
import { Pagination } from '@/src/dashboard/user-management/components/Pagination';
import { BookOpen, Check, X, Search } from 'lucide-react';

const MOCK_BLOGS = [
  { id: 'BLG-001', title: 'My Journey Through Cornea Transplant', author: 'Emma Davis', date: 'Oct 23, 2026', status: 'Pending', preview: 'A personal account of how receiving a new cornea changed my perspective on life and medical science...', content: 'Full content goes here...', seoOptimized: true },
  { id: 'BLG-002', title: 'The Importance of Rare Blood Donations', author: 'Dr. Gregory House', date: 'Oct 21, 2026', status: 'Pending', preview: 'Why we desperately need more individuals with AB- and O- blood types to participate in ongoing drives.', content: 'Full content goes here...', seoOptimized: true },
  { id: 'BLG-003', title: 'A Second Chance at Life', author: 'Robert Ford', date: 'Oct 19, 2026', status: 'Approved', preview: 'Surviving kidney failure and the angel donor who saved my family.', content: 'Full content goes here...', seoOptimized: false }
];

export default function BlogApprovalPage() {
  const [blogs, setBlogs] = useState(MOCK_BLOGS);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAction = (id: string, newStatus: string) => {
    // Expected API Call: POST /api/blogs/:id/moderate
    setBlogs(blogs.map(b => b.id === id ? { ...b, status: newStatus } : b));
    if (selectedBlog && selectedBlog.id === id) {
      setSelectedBlog({ ...selectedBlog, status: newStatus });
      setIsModalOpen(false);
    }
  };

  const pendingBlogs = blogs.filter(b => b.status === 'Pending');
  const otherBlogs = blogs.filter(b => b.status !== 'Pending');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Blog Moderation</h2>
          <p className="text-[var(--text-muted)] text-sm">Review, approve, or reject user-submitted stories.</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
          <BookOpen className="text-[var(--primary)]" />
          Pending Reviews ({pendingBlogs.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingBlogs.map(blog => (
            <Card key={blog.id} className="flex flex-col p-0 overflow-hidden">
              <div className="h-32 bg-gray-100 dark:bg-gray-800 relative">
                {/* Dummy Blog Cover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
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
                <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-6 flex-1">
                  {blog.preview}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSelectedBlog(blog); setIsModalOpen(true); }}
                    className="flex-1 py-2 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-sm font-medium hover:bg-[var(--primary-glow)] transition-colors"
                  >
                    Preview
                  </button>
                  <button 
                    onClick={() => handleAction(blog.id, 'Approved')}
                    className="w-10 h-10 flex items-center justify-center bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500/20 transition-colors"
                  >
                    <Check size={18} />
                  </button>
                  <button 
                    onClick={() => handleAction(blog.id, 'Rejected')}
                    className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {otherBlogs.length > 0 && (
        <div className="mt-8 pt-8 border-t border-[var(--border-main)]">
          <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4">Recently Processed</h3>
          <div className="space-y-4">
            {otherBlogs.map(blog => (
              <div key={blog.id} className="flex items-center justify-between p-4 glass rounded-xl border border-[var(--border-main)]">
                <div>
                  <h4 className="font-medium text-[var(--text-main)]">{blog.title}</h4>
                  <p className="text-xs text-[var(--text-muted)]">By {blog.author} • {blog.date}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${blog.status === 'Approved' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {blog.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Blog Preview"
      >
        {selectedBlog && (
          <div className="space-y-6">
            <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center">
               <span className="text-gray-400 font-medium">Cover Image Placeholder</span>
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
              <p className="text-lg leading-relaxed">{selectedBlog.preview}</p>
              <br />
              <p className="text-gray-400 italic">[Full content would render here...]</p>
            </div>

            {selectedBlog.status === 'Pending' && (
              <div className="flex gap-4 pt-6 border-t border-[var(--border-main)]">
                <button
                  onClick={() => handleAction(selectedBlog.id, 'Approved')}
                  className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Check size={20} /> Approve & Publish
                </button>
                <button
                  onClick={() => handleAction(selectedBlog.id, 'Rejected')}
                  className="flex-1 bg-[var(--bg-app)] border border-[var(--border-main)] hover:bg-red-50 hover:text-red-600 text-[var(--text-main)] py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X size={20} /> Reject Story
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
