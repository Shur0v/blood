'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { CircleHelp, Plus, Save, Trash2 } from 'lucide-react';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyDraft = { question: '', answer: '', sortOrder: 0, isActive: true };

export default function FaqManagerPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/faqs', { method: 'GET', credentials: 'include', cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setError(payload.message || 'Failed to load FAQ items.');
        return;
      }
      setItems(payload.data || []);
    } catch {
      setError('Failed to load FAQ items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createFaq = async () => {
    setCreating(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setError(payload.message || 'Failed to create FAQ.');
        return;
      }
      setItems(payload.data || []);
      setDraft(emptyDraft);
      setMessage('FAQ created.');
    } catch {
      setError('Failed to create FAQ.');
    } finally {
      setCreating(false);
    }
  };

  const saveFaq = async (item: FaqItem) => {
    setSavingId(item.id);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/faqs/${item.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setError(payload.message || 'Failed to update FAQ.');
        return;
      }
      setItems(payload.data || []);
      setMessage('FAQ updated.');
    } catch {
      setError('Failed to update FAQ.');
    } finally {
      setSavingId(null);
    }
  };

  const deleteFaq = async (id: string) => {
    setDeletingId(id);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setError(payload.message || 'Failed to delete FAQ.');
        return;
      }
      setItems(payload.data || []);
      setMessage('FAQ deleted.');
    } catch {
      setError('Failed to delete FAQ.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <CircleHelp className="text-blue-500" />
          FAQ Manager
        </h2>
        <p className="mt-1 text-sm text-gray-500">Manage homepage FAQ content with full CRUD control.</p>
      </div>

      <Card title="Create New FAQ">
        <div className="grid grid-cols-1 gap-4">
          <input
            value={draft.question}
            onChange={(e) => setDraft((prev) => ({ ...prev, question: e.target.value }))}
            placeholder="Question"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
          />
          <textarea
            value={draft.answer}
            onChange={(e) => setDraft((prev) => ({ ...prev, answer: e.target.value }))}
            placeholder="Answer"
            className="min-h-[120px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="number"
              min={0}
              value={draft.sortOrder}
              onChange={(e) => setDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value || 0) }))}
              placeholder="Sort order"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
            />
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Active on website
            </label>
            <button
              type="button"
              disabled={creating}
              onClick={() => void createFaq()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Plus size={16} />
              {creating ? 'Creating...' : 'Add FAQ'}
            </button>
          </div>
        </div>
      </Card>

      <Card title="All FAQ Items">
        {loading ? (
          <p className="text-sm text-gray-500">Loading FAQ items...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">No FAQ items found.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <FaqEditorRow
                key={item.id}
                item={item}
                onSave={saveFaq}
                onDelete={deleteFaq}
                saving={savingId === item.id}
                deleting={deletingId === item.id}
              />
            ))}
          </div>
        )}
      </Card>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
    </div>
  );
}

function FaqEditorRow({
  item,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  item: FaqItem;
  onSave: (item: FaqItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
  deleting: boolean;
}) {
  const [local, setLocal] = useState(item);

  useEffect(() => {
    setLocal(item);
  }, [item]);

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="grid grid-cols-1 gap-3">
        <input
          value={local.question}
          onChange={(e) => setLocal((prev) => ({ ...prev, question: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
        />
        <textarea
          value={local.answer}
          onChange={(e) => setLocal((prev) => ({ ...prev, answer: e.target.value }))}
          className="min-h-[110px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="number"
            min={0}
            value={local.sortOrder}
            onChange={(e) => setLocal((prev) => ({ ...prev, sortOrder: Number(e.target.value || 0) }))}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
          />
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700">
            <input
              type="checkbox"
              checked={local.isActive}
              onChange={(e) => setLocal((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Active
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave(local)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void onDelete(local.id)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            <Trash2 size={15} />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
