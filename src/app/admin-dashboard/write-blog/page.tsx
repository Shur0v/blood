'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { Type, Bold, Italic, Link as LinkIcon, Image as ImageIcon, List, CheckCircle, AlertTriangle } from 'lucide-react';

export default function WriteBlogPage() {

  // API Integration Note: 
  // Blog submission connects to POST /api/admin/blogs
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-2xl font-bold">Content Editor (CMS)</h2>
        <p className="text-sm text-gray-500 mt-1">Publish SEO-ready health articles, urgent announcements, and stories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Editor Canvas */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
               <input type="text" className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700" placeholder="Post Title Here..." />
            </div>
            
            {/* Toolbar mock */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/10">
               {[Type, Bold, Italic, LinkIcon, ImageIcon, List].map((Icon, i) => (
                 <button key={i} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition">
                   <Icon size={16} />
                 </button>
               ))}
               <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
               <select className="bg-transparent text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded py-1 px-2 outline-none">
                 <option>Paragraph</option><option>Heading 2</option><option>Heading 3</option><option>Code Block</option>
               </select>
            </div>

            {/* Content Area */}
            <div className="p-6 h-[400px]">
               <textarea className="w-full h-full resize-none text-gray-800 dark:text-gray-200 bg-transparent outline-none text-lg leading-relaxed" placeholder="Start writing your article..."></textarea>
            </div>
          </Card>

          <Card title="Blog Metadata & Categorization">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
                  <select className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none">
                    <option>Health Tips</option>
                    <option>Organ Donation Awareness</option>
                    <option>Urgent Appeals</option>
                    <option>Platform News</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Author Tags</label>
                  <input type="text" placeholder="e.g. Dr. House, Admin" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Featured Image Upload</label>
                  <input type="file" className="text-sm" />
                </div>
             </div>
          </Card>
        </div>

        {/* Sidebar SEO & Publish Box */}
        <div className="lg:col-span-1 space-y-6">
           <Card title="Publish Panel" className="bg-white dark:bg-[#1a1b23]">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-bold">Draft</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Visibility:</span>
                  <span className="font-bold">Public</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-800" />
                <button className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">Preview</button>
                <button className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-md">Publish Now</button>
              </div>
           </Card>

           <Card title="SEO Optimizer" className="bg-gray-50/50 dark:bg-gray-800/10">
             <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">SEO Title Length: <span className="text-emerald-500">45/60</span></label>
                  <input type="text" placeholder="SEO Title..." className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded p-2 text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Meta Desc Length: <span className="text-amber-500">20/160</span></label>
                  <textarea rows={3} placeholder="Meta description..." className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded p-2 text-sm resize-none" />
               </div>
               
               <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                 <p className="flex items-center gap-2 text-xs font-medium text-emerald-500"><CheckCircle size={14}/> Keyword in Title</p>
                 <p className="flex items-center gap-2 text-xs font-medium text-amber-500"><AlertTriangle size={14}/> Missing canonical URL</p>
                 <p className="flex items-center gap-2 text-xs font-medium text-amber-500"><AlertTriangle size={14}/> Add image alt attributes</p>
               </div>
             </div>
           </Card>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-bold mb-4">Published & Draft Content</h3>
        <Table headers={['Title', 'Category', 'Author', 'Status', 'Date', 'Views', 'Actions']}>
          <TableRow>
            <TableCell className="font-semibold max-w-[200px] truncate">Why Rare Blood Types Matter</TableCell>
            <TableCell>Health Tips</TableCell>
            <TableCell>Admin</TableCell>
            <TableCell><Badge type="success">Published</Badge></TableCell>
            <TableCell>Oct 24, 2026</TableCell>
            <TableCell>1,240</TableCell>
            <TableCell><button className="text-sm font-medium text-blue-600">Edit</button></TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold max-w-[200px] truncate">10 Myths About Organ Donation</TableCell>
            <TableCell>Awareness</TableCell>
            <TableCell>Dr. Smith</TableCell>
            <TableCell><Badge type="warning">Draft</Badge></TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
            <TableCell><button className="text-sm font-medium text-blue-600">Edit</button></TableCell>
          </TableRow>
        </Table>
      </div>

    </div>
  );
}
