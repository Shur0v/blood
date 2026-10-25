import {z} from 'zod';
// Significant page-template update; never replace with a request/build timestamp.
export const GLOBAL_CITY_REVISION='2026-10-25T15:49:01Z';
export const REGIONAL_CITY_REVISION='2026-10-25T09:22:00Z';
export const RegionalContentSchema=z.object({
  country:z.string().trim().min(1).max(100), city:z.string().trim().max(120).nullable().default(null),
  title:z.string().trim().max(140), summary:z.string().trim().max(1200),published:z.boolean(),
  slides:z.array(z.object({assetId:z.string().uuid(),alt:z.string().trim().min(5).max(240),caption:z.string().trim().min(1).max(360),credit:z.string().trim().min(1).max(160),sourceUrl:z.union([z.literal(''),z.string().url().max(1000).refine(value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}})]),eventDate:z.union([z.literal(''),z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{const date=new Date(value);return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;})])}).strict()).max(6),
}).strict().refine(value=>!value.published||Boolean(value.title&&value.summary),{message:'Published updates need a title and summary.'});
export type RegionalContentInput=z.infer<typeof RegionalContentSchema>;
export type RegionalSlide=RegionalContentInput['slides'][number]&{url:string;width:number|null;height:number|null};
export type PublicRegionalContent={title:string;summary:string;updatedAt:string;slides:RegionalSlide[]};
