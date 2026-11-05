import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {INDIA_AREAS,INDIA_CITIES,INDIA_STATES,INDIA_RESERVED,IndiaConfigSchema,IndiaRecipeSchema,indiaDirectoryArea,matchesIndiaCity,indiaSearchCopy} from '../src/lib/indiaLocal';
import {INDIA_RECIPES,indiaRecipe} from '../src/lib/indiaRecipes';
import {INDIA_COMPONENTS,INDIA_SECTION_COMPONENTS} from '../src/components/india/local/IndiaSections';
import {INDIA_LOCAL_COPY} from '../src/lib/indiaLocalCopy';
import type {IndiaContext} from '../src/components/india/local/types';
Object.assign(globalThis,{React});
const context:IndiaContext={area:INDIA_CITIES[0],config:{},coverage:{registered:0,manual:0,organizations:1,worldwide:100,unresolved:0,available:true},locations:[],published:INDIA_AREAS,regional:null,city:'Chennai',mode:'blood',legacy:false,articles:[]};
test('India library has sixty registered components and fixed twelve-section recipes',()=>{
 assert.equal(Object.keys(INDIA_COMPONENTS).length,60);assert.equal(INDIA_RESERVED.length,57);
 assert.equal(INDIA_STATES.length,6);assert.equal(INDIA_CITIES.length,20);
 assert.equal(new Set(Object.values(INDIA_COMPONENTS)).size,60);
 assert.equal(new Set(Object.values(INDIA_RECIPES).map(r=>r.join('|'))).size,Object.keys(INDIA_RECIPES).length);
 for(const area of INDIA_AREAS){assert.ok(IndiaRecipeSchema.safeParse(indiaRecipe(area.id)).success);assert.equal(3+indiaRecipe(area.id).length,12);}
 assert.equal(new Set(Object.values(INDIA_RECIPES).flat()).size,57);
 assert.deepEqual(indiaRecipe('new-location'),indiaRecipe('new-location'));
});
test('all reserved structures render meaningful distinct content and respect section visibility',()=>{
 const texts=new Set<string>(),structures=new Set<string>();
 for(const id of INDIA_RESERVED){const content=INDIA_LOCAL_COPY[id];assert.ok(content.lead.length>=70,id);assert.ok(content.items.length>=3,id);assert.ok(!texts.has(content.lead),id);texts.add(content.lead);
  const html=renderToStaticMarkup(React.createElement(INDIA_SECTION_COMPONENTS[id],{context}));assert.ok(html.includes('data-india-component="'+id+'"'));assert.ok(!html.includes('undefined'));structures.add(html.replace(/>[^<>]*</g,'><').replace(/data-india-component="[^"]+"|id="india-[^"]+"/g,''));
  assert.equal(renderToStaticMarkup(React.createElement(INDIA_SECTION_COMPONENTS[id],{context:{...context,config:{sections:{[id]:{hidden:true}}}}})), '');
 }
 assert.equal(texts.size,57);assert.equal(structures.size,57,'A different name alone cannot count as a structure');
});
test('India content accepts bounded plain text and rejects unsafe or invalid configuration',()=>{
 for(const value of [{html:'<script>x</script>'},{title:'<script>x</script>'},{sections:{arbitrary:{title:'x'}}},{sections:{search:{hidden:true}}},{recipe:Array(9).fill('local-faq')},{resources:['https://evil.invalid']},{title:'x'.repeat(181)}])assert.equal(IndiaConfigSchema.safeParse(value).success,false);
 assert.ok(IndiaConfigSchema.safeParse({sections:{'local-faq':{hidden:true,variant:'saffron'}}}).success);
});
test('reviewed aliases and state mappings do not rename records or assign broad state labels to cities',()=>{
 assert.equal(indiaDirectoryArea('Bangalore').id,'bengaluru');assert.equal(indiaDirectoryArea('Mysore').id,'mysuru');assert.equal(indiaDirectoryArea('Odisha').kind,'state');assert.equal(indiaDirectoryArea('Unreviewed place').kind,'legacy');
 const bhubaneswar=INDIA_CITIES.find(a=>a.id==='bhubaneswar')!;
 assert.ok(matchesIndiaCity(bhubaneswar,{city:'Bhubaneswar',lat:20.296,lng:85.825}));assert.ok(!matchesIndiaCity(bhubaneswar,{city:'Odisha',lat:20.296,lng:85.825}));assert.ok(!matchesIndiaCity(bhubaneswar,{city:'Bhubaneswar',lat:null,lng:null}));
 const banda=INDIA_CITIES.find(a=>a.id==='banda')!;assert.ok(!matchesIndiaCity(banda,{city:'Banda',lat:24,lng:78}));
 assert.match(indiaSearchCopy(INDIA_CITIES[0],'O+').title,/O\+ Blood donor directory in Chennai, Tamil Nadu/);assert.match(indiaSearchCopy(banda,undefined,'organ').description,/do not allocate/);
});
