'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { GripVertical, Edit, Trash2, Plus, ArrowRight, Image as ImageIcon } from 'lucide-react';

export default function SliderManagerPage() {

  // API Integration Note: 
  // GET /api/admin/content/slider to fetch current slides
  // PUT /api/admin/content/slider/order to save reordering

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Homepage Slider Content</h2>
          <p className="text-sm text-gray-500 mt-1">Manage the core hero sliders without altering the public website structural design.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Side: List & Editor */}
        <div className="lg:col-span-3 space-y-6">
          <Card title="Current Active Slides (Drag to Reorder)">
             <div className="space-y-3">
               {[
                 { id: 1, title: 'Save a Life Today', active: true, order: 1 },
                 { id: 2, title: 'Global Organ Registry', active: true, order: 2 },
                 { id: 3, title: 'Urgent: AB- Needed', active: false, order: 3 },
               ].map((slide) => (
                 <div key={slide.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-xl group cursor-move">
                    <GripVertical className="text-gray-400 group-hover:text-gray-600" />
                    <div className="w-16 h-12 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center">
                      <ImageIcon size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{slide.title}</p>
                      <Badge type={slide.active ? 'success' : 'default'} className="mt-1">{slide.active ? 'Visible' : 'Hidden'}</Badge>
                    </div>
                    <div className="flex gap-2">
                       <button className="p-2 text-gray-500 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-800 rounded transition"><Edit size={16}/></button>
                       <button className="p-2 text-gray-500 hover:text-red-500 hover:bg-white dark:hover:bg-gray-800 rounded transition"><Trash2 size={16}/></button>
                    </div>
                 </div>
               ))}
             </div>
             <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition flex justify-center items-center gap-2">
               <Plus size={18} /> Add New Slide
             </button>
          </Card>

          <Card title="Slide Editor (Add/Edit)">
             <form className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Slide Title</label>
                  <input type="text" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500" placeholder="e.g. Save a Life Today" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Short Description</label>
                  <textarea rows={2} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500" placeholder="Enter supporting text..."></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Call to Action (CTA)</label>
                    <input type="text" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" placeholder="e.g. Donate Now" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">CTA URL</label>
                    <input type="text" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" placeholder="/request-organ" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Background Image Upload</label>
                  <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-600 hover:file:bg-red-100" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" className="w-4 h-4 rounded text-red-600" defaultChecked />
                    Active / Visible to public
                  </label>
                </div>
                <button type="button" className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-2.5 rounded-lg shadow-sm">Save Slide</button>
             </form>
          </Card>
        </div>

        {/* Right Side: Live Preview */}
        <div className="lg:col-span-2">
           <Card title="Homepage Approximate Preview" className="sticky top-8">
             <div className="aspect-[4/3] rounded-xl overflow-hidden relative group">
                <img src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=800" alt="mock preview" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex flex-col justify-center p-6 text-white">
                  <Badge type="danger" className="w-fit mb-3 bg-red-500/20 text-red-300 border-red-500/30">Preview Mode</Badge>
                  <h3 className="text-3xl font-bold mb-2">Save a Life Today</h3>
                  <p className="text-gray-200 text-sm max-w-[80%] mb-5">Your contribution can give someone a second chance at life. Join our global registry.</p>
                  <button className="bg-red-600 text-white px-5 py-2 rounded-full font-bold text-sm max-w-fit flex items-center gap-2">Donate Now <ArrowRight size={14}/></button>
                </div>
             </div>
             <p className="text-center text-xs text-gray-400 mt-4">Actual sizing behavior depends on users screen. The structural design of the hero section is preserved.</p>
           </Card>
        </div>
      </div>
    </div>
  );
}
