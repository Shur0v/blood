'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { GripVertical, Edit, Trash2, Plus, Loader2, Upload } from 'lucide-react';
import type { HomepageSlide } from '@/src/types/homepageSlide';

type FormState = {
  id: string | null;
  title: string;
  description: string;
  image_url: string;
  status: 'ACTIVE' | 'INACTIVE';
};

const emptyForm: FormState = {
  id: null,
  title: '',
  description: '',
  image_url: '',
  status: 'ACTIVE',
};

export default function SliderManagerPage() {
  const initializedFormRef = React.useRef(false);
  const [slides, setSlides] = React.useState<HomepageSlide[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const loadSlides = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/homepage-slides', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to load slides.');
      }
      setSlides(payload.data || []);
      if (!initializedFormRef.current && payload.data?.[0]) {
        const first: HomepageSlide = payload.data[0];
        setForm({
          id: first.id,
          title: first.title,
          description: first.description || '',
          image_url: first.image_url,
          status: first.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        });
        initializedFormRef.current = true;
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to load slides.';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadSlides();
  }, [loadSlides]);

  const selectedPreviewSlide = useMemo(() => {
    if (form.image_url.trim()) {
      return {
        title: form.title || 'Slide title preview',
        description: form.description || 'Slide description preview',
        image_url: form.image_url,
      };
    }
    return (
      slides.find((s) => s.id === form.id) ??
      slides.find((s) => s.status === 'ACTIVE') ?? {
        title: 'No slide selected',
        description: 'Select or add a slide to preview.',
        image_url:
          'https://surgmedia.com/wp-content/uploads/2020/10/2171-blood-donation.jpg',
      }
    );
  }, [form, slides]);

  const fillFormFromSlide = (slide: HomepageSlide) => {
    setForm({
      id: slide.id,
      title: slide.title,
      description: slide.description || '',
      image_url: slide.image_url,
      status: slide.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
    setMessage(null);
  };

  const handleAddNew = () => {
    setForm(emptyForm);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setMessage({ type: 'error', text: 'Slide title is required.' });
      return;
    }
    if (!form.image_url.trim()) {
      setMessage({ type: 'error', text: 'Slide image URL is required.' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const isEdit = Boolean(form.id);
      const endpoint = isEdit ? `/api/admin/homepage-slides/${form.id}` : '/api/admin/homepage-slides';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          image_url: form.image_url.trim(),
          status: form.status,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to save slide.');
      }

      await loadSlides();
      if (payload?.data) {
        fillFormFromSlide(payload.data);
      }
      setMessage({ type: 'success', text: isEdit ? 'Slide updated.' : 'Slide added.' });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to save slide.';
      setMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/homepage-slides/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to delete slide.');
      }

      const remaining = slides.filter((slide) => slide.id !== id);
      setSlides(remaining);
      if (form.id === id) {
        if (remaining[0]) {
          fillFormFromSlide(remaining[0]);
        } else {
          setForm(emptyForm);
        }
      }
      setMessage({ type: 'success', text: 'Slide deleted.' });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to delete slide.';
      setMessage({ type: 'error', text });
    }
  };

  const persistOrder = async (orderedIds: string[]) => {
    const res = await fetch('/api/admin/homepage-slides/reorder', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
    const payload = await res.json();
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to reorder slides.');
    }
  };

  const reorderLocal = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    const sourceIndex = slides.findIndex((s) => s.id === fromId);
    const targetIndex = slides.findIndex((s) => s.id === toId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const nextSlides = [...slides];
    const [moved] = nextSlides.splice(sourceIndex, 1);
    nextSlides.splice(targetIndex, 0, moved);

    const normalized = nextSlides.map((slide, index) => ({
      ...slide,
      order: index + 1,
    }));

    setSlides(normalized);
    void persistOrder(normalized.map((s) => s.id)).catch((error) => {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Reorder failed.' });
      void loadSlides();
    });
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      setMessage(null);

      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', 'SLIDER');

      const res = await fetch('/api/uploads/image', {
        method: 'POST',
        body: fd,
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to upload image.');
      }

      setForm((prev) => ({ ...prev, image_url: payload.data.url }));
      setMessage({ type: 'success', text: 'Image uploaded. Save slide to apply changes.' });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to upload image.';
      setMessage({ type: 'error', text });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Homepage Slider Content</h2>
          <p className="text-sm text-gray-500 mt-1">Fully dynamic DB-backed slider manager. Edits here are the same data used on homepage.</p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <Card title="Current Active Slides (Drag to Reorder)">
            {loading ? (
              <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading slides...
              </div>
            ) : (
              <div className="space-y-3">
                {slides.map((slide) => (
                  <div
                    key={slide.id}
                    draggable
                    onDragStart={() => setDraggingId(slide.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggingId) reorderLocal(draggingId, slide.id);
                      setDraggingId(null);
                    }}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-xl group cursor-move"
                  >
                    <GripVertical className="text-gray-400 group-hover:text-gray-600" />
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-16 h-12 object-cover rounded"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{slide.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge type={slide.status === 'ACTIVE' ? 'success' : 'default'}>
                          {slide.status === 'ACTIVE' ? 'Visible' : 'Hidden'}
                        </Badge>
                        <span className="text-xs text-gray-400">Order #{slide.order}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fillFormFromSlide(slide)}
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-800 rounded transition"
                        aria-label="Edit slide"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => void handleDelete(slide.id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-white dark:hover:bg-gray-800 rounded transition"
                        aria-label="Delete slide"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleAddNew}
              className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition flex justify-center items-center gap-2"
            >
              <Plus size={18} /> Add New Slide
            </button>
          </Card>

          <Card title="Slide Editor (Add/Edit)">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Slide Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500"
                  placeholder="e.g. Save a Life Today"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Short Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500"
                  placeholder="Enter supporting text..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Background Image URL</label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
                    className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Upload Image</label>
                  <label className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none flex items-center justify-center gap-2 cursor-pointer hover:border-red-400 transition">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'Uploading...' : 'Choose image'}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => void handleImageUpload(event.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-red-600"
                    checked={form.status === 'ACTIVE'}
                    onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.checked ? 'ACTIVE' : 'INACTIVE' }))}
                  />
                  Active / Visible to public
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-2.5 rounded-lg shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {form.id ? 'Update Slide' : 'Save Slide'}
              </button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Homepage Live Preview (Same Data)">
            <div className="aspect-[4/3] rounded-xl overflow-hidden relative group">
              <img
                src={selectedPreviewSlide.image_url}
                alt={selectedPreviewSlide.title}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-2xl font-bold mb-2 line-clamp-2">{selectedPreviewSlide.title}</h3>
                <p className="text-gray-200 text-sm line-clamp-3">
                  {selectedPreviewSlide.description || 'No description provided.'}
                </p>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">This preview uses the same slide fields as homepage slider.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
