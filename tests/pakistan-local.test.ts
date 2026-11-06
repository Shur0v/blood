import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PAKISTAN_AREAS,PAKISTAN_CITIES,PAKISTAN_REGIONS,PAKISTAN_RESERVED,PakistanConfigSchema,PakistanRecipeSchema,pakistanDirectoryArea,pakistanSearchCopy,pakistanDirectorySearchCopy,matchesPakistanCity} from '../src/lib/pakistanLocal';
import {PAKISTAN_RECIPES,pakistanRecipe} from '../src/lib/pakistanRecipes';
import {PAKISTAN_COMPONENTS,PAKISTAN_SECTION_COMPONENTS} from '../src/components/pakistan/local/PakistanSections';
import {PAKISTAN_LOCAL_COPY} from '../src/lib/pakistanLocalCopy';
import type {PakistanContext} from '../src/components/pakistan/local/types';
import {analyticsPagePath} from '../src/lib/analytics';
Object.assign(globalThis,{React});
const context:PakistanContext={area:PAKISTAN_CITIES[0],config:{},coverage:{registered:0,manual:0,organizations:1,worldwide:100,unresolved:0,available:true},locations:[],published:PAKISTAN_AREAS,regional:null,city:'Lahore',mode:'blood',legacy:false,articles:[]};
test('Pakistan library has sixty distinct registrations and fixed twelve-section compositions',()=>{
 assert.equal(Object.keys(PAKISTAN_COMPONENTS).length,60);assert.equal(new Set(Object.values(PAKISTAN_COMPONENTS)).size,60);assert.equal(PAKISTAN_RESERVED.length,57);assert.equal(PAKISTAN_REGIONS.length,7);assert.equal(PAKISTAN_CITIES.length,24);
 for(const recipe of Object.values(PAKISTAN_RECIPES)){assert.ok(PakistanRecipeSchema.safeParse(recipe).success);assert.equal(recipe.length+3,12);}
 assert.equal(new Set(Object.values(PAKISTAN_RECIPES).map(r=>r.join('|'))).size,Object.keys(PAKISTAN_RECIPES).length);assert.equal(new Set(Object.values(PAKISTAN_RECIPES).flat()).size,57);
 assert.deepEqual(pakistanRecipe('new-place'),pakistanRecipe('new-place'));
});
test('reserved sections have distinct semantic structure, practical copy and effective visibility controls',()=>{
 const structures=new Set<string>(),leads=new Set<string>();
 for(const id of PAKISTAN_RESERVED){const copy=PAKISTAN_LOCAL_COPY[id];assert.ok(copy.lead.length>=90,id);assert.ok(copy.items.length>=3,id);leads.add(copy.lead);
  const html=renderToStaticMarkup(React.createElement(PAKISTAN_SECTION_COMPONENTS[id],{context}));assert.ok(html.includes('data-pakistan-component="'+id+'"'));assert.ok(!html.includes('undefined'),id);assert.ok(!/e-RaktKosh|NOTTO|India local/.test(html),id);
  structures.add(html.replace(/>[^<>]*</g,'><').replace(/\s(?:class|id|data-pakistan-component)="[^"]*"/g,''));
  assert.equal(renderToStaticMarkup(React.createElement(PAKISTAN_SECTION_COMPONENTS[id],{context:{...context,config:{sections:{[id]:{hidden:true}}}}})), '');
 }
 assert.equal(leads.size,57);assert.equal(structures.size,57,'Different colors or section names alone are insufficient');
});
test('Pakistan registry preserves administrative scope, reviewed aliases and Urdu labels without rewriting accounts',()=>{
 assert.equal(new Set(PAKISTAN_AREAS.map(a=>a.context)).size,31);
 for(const area of PAKISTAN_AREAS){assert.ok(area.context.length>100);assert.match(area.urdu!,/\p{Script=Arabic}/u);if(area.kind==='city')assert.match(area.reference!,/^https:\/\/www.geonames.org\/\d+\/$/);assert.ok(area.path?.startsWith('/pakistan/'));}
 assert.equal(pakistanDirectoryArea('Punjab').kind,'region');assert.match(pakistanDirectorySearchCopy('Punjab').title,/entries labelled Punjab/);assert.match(pakistanDirectorySearchCopy('Punjab').description,/separate from/);assert.equal(pakistanDirectoryArea('Kashmir').kind,'legacy');assert.equal(pakistanDirectoryArea('Shekhupura').id,'sheikhupura');assert.equal(pakistanDirectoryArea('New Mirpur').id,'mirpur');
 const mirpur=PAKISTAN_CITIES.find(a=>a.id==='mirpur')!;assert.ok(matchesPakistanCity(mirpur,{city:'Mirpur',lat:33.15,lng:73.75}));assert.ok(!matchesPakistanCity(mirpur,{city:'Mirpur',lat:23.8,lng:90.4}));assert.ok(!matchesPakistanCity(mirpur,{city:'Mirpur',lat:null,lng:null}));assert.ok(!matchesPakistanCity(mirpur,{city:'Punjab',lat:33.15,lng:73.75}));
 assert.match(pakistanSearchCopy(PAKISTAN_CITIES[0],'O+').title,/O\+ Blood donor entries in Lahore, Punjab/);assert.match(pakistanSearchCopy(PAKISTAN_REGIONS[0]).title,/guide for Punjab/);
});
test('bounded configuration rejects executable content, unknown sections, arbitrary resources and hidden discovery',()=>{
 for(const value of [{html:'<script>x</script>'},{title:'<img src=x>'},{urduLabel:'x'.repeat(101)},{recipe:Array(9).fill('local-faq')},{sections:{introduction:{hidden:true}}},{sections:{unknown:{title:'x'}}},{resources:['https://evil.invalid']}])assert.equal(PakistanConfigSchema.safeParse(value).success,false);
 assert.ok(PakistanConfigSchema.safeParse({urduLabel:'لاہور',sections:{'local-faq':{variant:'mint',hidden:true}}}).success);
 assert.equal(analyticsPagePath('pakistan > preview > lahore'),null);
 const intro=renderToStaticMarkup(React.createElement(PAKISTAN_COMPONENTS.introduction,{context}));assert.ok(intro.includes('lang="ur" dir="rtl"'));assert.ok(intro.includes('Registered accounts worldwide'));assert.ok(intro.includes('organization-only'));const failure=renderToStaticMarkup(React.createElement(PAKISTAN_COMPONENTS.introduction,{context:{...context,coverage:{...context.coverage,available:false}}}));assert.ok(failure.includes('Coverage could not be loaded'));assert.ok(!failure.includes('Registered accounts worldwide'));
});
