import {z} from 'zod';
export const PublicImagePlacementSchema=z.object({assetId:z.string().uuid(),alt:z.string().trim().max(240),decorative:z.boolean().default(false),caption:z.string().trim().max(500).default('')}).strict().refine(value=>value.decorative||value.alt.length>=5,'Describe the image or mark it decorative.');
export const PublicImageMetadataSchema=z.object({filename:z.string().trim().min(3).max(100),credit:z.string().trim().max(160).default(''),sourcePage:z.union([z.literal(''),z.string().url().max(1000).refine(value=>{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;})]).default(''),licenseUrl:z.union([z.literal(''),z.string().url().max(1000).refine(value=>{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;})]).default(''),rightsConfirmed:z.literal(true)}).strict();
export type PublicImagePlacement=z.infer<typeof PublicImagePlacementSchema>;
export type PublicImageMetadata=z.infer<typeof PublicImageMetadataSchema>;
export type ManagedImage={id:string;url:string;width:number;height:number;variants:Array<{url:string;width:number;height:number}>;metadata:PublicImageMetadata};
export function imageSrcSet(image:ManagedImage){return image.variants.map(item=>`${item.url} ${item.width}w`).join(', ');}
export function imageFilename(input:string){return input.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'bloodnet-community-image';}
