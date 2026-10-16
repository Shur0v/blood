import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {DONATION_GUIDES,DONATION_SOURCES,GLOBAL_EVIDENCE} from '../src/lib/donationGuides';

import {keywordDestination} from '../src/lib/keywordDestination';
import {isDiscoveryPath} from '../src/lib/discoveryRoutes';
import type {ResearchContext} from '../src/components/research/types';
Object.assign(globalThis,{React});
const {RESEARCH_COMPONENT_FAMILIES,guideComposition}=await import('../src/components/research/GuideExperience');
const location={city:'Dhaka',country:'Bangladesh',bloodCount:17,organCount:2,bloodGroups:['A+','O-'],organs:['Kidney'],updatedAt:new Date('2026-10-15')};
test('twelve distinct substantial guides use attributed primary sources',()=>{
  assert.equal(DONATION_GUIDES.length,12);
  const seen=new Set<string>();
  for(const guide of DONATION_GUIDES){assert.equal(guide.chapters.length,5);assert.ok(guide.questions.length>=3);for(const chapter of guide.chapters){assert.ok(chapter.text.split(/\s+/).length>=65,chapter.title);assert.ok(!seen.has(chapter.text));seen.add(chapter.text);}for(const id of guide.sources)assert.match(DONATION_SOURCES[id].url,/^https:\/\/(www\.who\.int|www\.nhsbt\.nhs\.uk)\//);}
});
test('sixty distinct components render and all are used in unique guide compositions',()=>{
  const all=RESEARCH_COMPONENT_FAMILIES.flat();assert.equal(all.length,60);assert.equal(new Set(all).size,60);
  const used=new Set(DONATION_GUIDES.flatMap((_,i)=>guideComposition(i)));assert.equal(used.size,60);
  assert.equal(new Set(DONATION_GUIDES.map((_,i)=>guideComposition(i).map(fn=>fn.name).join(','))).size,12);
  const context:ResearchContext={guide:DONATION_GUIDES[0],snapshot:{available:true,locations:[location],metrics:[{label:'Fixture entries',value:17,note:'Synthetic test data'}],retrievedAt:'2026-10-16T00:00:00Z',recordUpdatedAt:'2026-10-15T00:00:00Z'},evidence:GLOBAL_EVIDENCE[0],sources:['blood']};
  for(const Block of all){const html=renderToStaticMarkup(React.createElement(Block,{context}));assert.ok(html.length>100,Block.name);assert.ok(!html.includes('undefined'),Block.name);}
});
test('old keywords resolve only to actual coverage or a relevant guide',()=>{
  assert.equal(keywordDestination('O negative blood donor Dhaka Bangladesh',[location]),'/blood-donors/bangladesh/dhaka/o-negative');
  assert.equal(keywordDestination('AB negative blood donor Dhaka Bangladesh',[location]),'/guides/understand-blood-group-search');
  assert.equal(keywordDestination('donor Dhaka',[location,{...location,country:'India'}]),'/guides/find-blood-donors-near-you');
  assert.equal(keywordDestination('blood donor Atlantis',[]),'/guides/find-blood-donors-near-you');
  assert.equal(keywordDestination('donor phone number',[]),'/guides/donor-privacy-and-public-profiles');
});
test('discovery embeds allow public SEO pages and exclude private medical routes',()=>{
  for(const path of ['/guides','/network/bangladesh','/donors/volunteer-123','/blood-donors/bangladesh/dhaka/o-negative'])assert.ok(isDiscoveryPath(path));
  for(const path of ['/profile','/api/users/me/medical-reports','/admin-dashboard/users'])assert.ok(!isDiscoveryPath(path));
});
