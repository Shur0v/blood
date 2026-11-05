import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {USA_AREAS,USA_LOCAL_IDS,USA_MAIN_IDS,UsaConfigSchema,UsaCommandSchema,UsaRecipeSchema} from '../src/lib/usaEdition';
import {USA_LOCAL_COPY} from '../src/lib/usaLocalContent';
import {USA_CITY_REFERENCES,usaRecordMatchesArea} from '../src/lib/usaGeography';
import {USA_LOCAL_COMPONENTS} from '../src/components/usa/UsaLocalSections';
import {USA_MAIN_COMPONENTS} from '../src/components/usa/UsaMainSections';
import {regionalDesignContrastError} from '../src/lib/regionalDesign';
import type {UsaContext} from '../src/components/usa/types';
Object.assign(globalThis,{React});
test('USA registry has 70 distinct component functions and 14 fixed 3+9 area recipes',()=>{
 assert.equal(USA_MAIN_IDS.length,20);assert.equal(USA_LOCAL_IDS.length,50);
 assert.equal(new Set([...Object.values(USA_LOCAL_COMPONENTS),...Object.values(USA_MAIN_COMPONENTS)]).size,70);
 assert.equal(USA_AREAS.length,14);assert.equal(new Set(USA_AREAS.map(area=>area.recipe.join('|'))).size,14);
 for(const area of USA_AREAS){assert.ok(UsaRecipeSchema.safeParse(area.recipe).success);assert.equal(3+area.recipe.length,12);assert.match(area.path,area.kind==='state'?/^\/us\/states\//:/^\/us\/cities\//);for(const city of area.directoryCities)assert.ok(USA_CITY_REFERENCES[city]);}
 assert.equal(new Set(USA_AREAS.flatMap(area=>area.recipe)).size,50,'Every reserved component is used');
});
test('every reserved section has useful distinct copy and renderable semantic content',()=>{
 const area=USA_AREAS[1],context:UsaContext={area,place:area.name,config:{},coverage:{registered:0,manual:0,organizations:0,worldwide:0,available:true,unresolved:0},locations:[],publishedAreas:[],regional:null};
 const texts=new Set<string>();for(const id of USA_LOCAL_IDS){const copy=USA_LOCAL_COPY[id];assert.ok(copy.text.trim().length>0,id);assert.ok(copy.items.length>=2);assert.ok(!texts.has(copy.text));texts.add(copy.text);const html=renderToStaticMarkup(React.createElement(USA_LOCAL_COMPONENTS[id],{context}));assert.ok(html.includes('data-us-component="'+id+'"'));assert.ok(html.includes('<h2'));assert.ok(!html.includes('undefined'));}
});
test('USA content rejects arbitrary components, hidden discovery, dangerous URLs and oversized text',()=>{
 for(const value of [{sections:{search:{hidden:true}}},{sections:{arbitrary:{title:'x'}}},{recipe:Array(9).fill('first-call')},{title:'x'.repeat(161)},{resources:['https://evil.invalid']},{html:'<script>alert(1)</script>'}])assert.equal(UsaConfigSchema.safeParse(value).success,false);
 assert.equal(UsaCommandSchema.safeParse({areaId:'not-an-area',action:'publish',config:{}}).success,false);
 assert.equal(UsaConfigSchema.safeParse({title:'<script>alert(1)</script>'}).success,false);
 assert.equal(UsaConfigSchema.safeParse({sections:{privacy:{text:'<iframe src="https://evil.invalid"></iframe>'}}}).success,false);
 assert.ok(UsaConfigSchema.safeParse({sections:{privacy:{hidden:true,variant:'reverse'}}}).success);
 assert.equal(regionalDesignContrastError('United States'),null);
});
test('reviewed mappings distinguish same-name locations without inferring a state from text',()=>{
 const california=USA_AREAS[0],vegas=USA_AREAS[1];
 assert.ok(usaRecordMatchesArea(california,{city:'Los Angeles',lat:34.052,lng:-118.244}));
 assert.ok(!usaRecordMatchesArea(california,{city:'Las Vegas',lat:36.175,lng:-115.137}));
 assert.ok(!usaRecordMatchesArea(vegas,{city:'Las Vegas',lat:35.59,lng:-105.22}),'Las Vegas, New Mexico is not Las Vegas, Nevada');
 assert.ok(!usaRecordMatchesArea(vegas,{city:'Las Vegas',lat:null,lng:null}));
 assert.ok(!usaRecordMatchesArea(california,{city:'California',lat:34.052,lng:-118.244}));
});
