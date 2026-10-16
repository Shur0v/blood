import React from 'react';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import PublicDonorArticle from '../src/components/PublicDonorArticle';
import {donorArticle,BLOOD_SERVICE_SOURCE} from '../src/lib/publicProfileIntroductions';
test('all ten public articles have distinct practical sections without invented donor claims',()=>{
 const profile={name:'Demo Donor',bloodGroup:'O-',city:'Dhaka',country:'Bangladesh',bio:'Admin-reviewed factual introduction <script>alert(1)</script>',updatedAt:new Date('2026-10-16T12:00:00Z'),phone:null};
 const titles=new Set(),sections=new Set();
 for(let index=0;index<10;index++){
  const article=donorArticle(profile,index);titles.add(article.title);assert.equal(article.sections.length,2);
  for(const [title,text] of article.sections){sections.add(title);assert.ok(text.length>150);}
  const html=renderToStaticMarkup(<PublicDonorArticle profile={{...profile,articleTemplate:index}} localPath="/blood-donors/bangladesh/dhaka"/>);
  assert.match(html,/Admin-reviewed factual introduction &lt;script&gt;/);assert.ok(!html.includes('<script>'));
  assert.ok(html.includes(article.title));assert.ok(html.includes(BLOOD_SERVICE_SOURCE));assert.match(html,/Find local donor contacts/);assert.ok(!html.includes('href="tel:'));
  assert.ok(!html.includes('In their own words'));assert.ok(!html.includes('Shared by the donor'));assert.ok(!html.includes('has chosen'));
 }
 assert.equal(titles.size,10);assert.equal(sections.size,20);
 const published=renderToStaticMarkup(<PublicDonorArticle profile={{...profile,articleTemplate:3,phone:'+8801712345678'}} localPath="/cities"/>);assert.ok(published.includes('href="tel:+8801712345678"'));
});
