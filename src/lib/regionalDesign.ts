import {z} from 'zod';
import {getRegionalEdition} from './regionalEdition';

export const REGIONAL_COPY_FIELDS = [
 ['introTitle','Introduction heading',180],['introText','Introduction description',1200],
 ['searchTitle','Donor search heading',140],['searchText','Donor search description',800],
 ['locationsTitle','Related locations heading',180],['locationsText','Related locations description',800],
 ['faqTitle','FAQ heading',180],['faqText','FAQ introduction',800],
 ['guidanceTitle','Guidance heading',180],['guidanceText','Guidance introduction',1200],
 ['joinTitle','Registration heading',180],['joinText','Registration description',1200],['joinButton','Registration button',70],
 ['home5Title','First homepage invitation heading',180],['home5Text','First invitation description',800],['home5Button','First invitation button',70],
 ['home9Title','Second homepage invitation heading',180],['home9Text','Second invitation description',800],['home9Button','Second invitation button',70],
 ['home12Title','Closing invitation heading',180],['home12Text','Closing invitation description',800],['home12Button','Closing invitation button',70],
] as const;
export type RegionalCopyKey=typeof REGIONAL_COPY_FIELDS[number][0];
const copyShape=Object.fromEntries(REGIONAL_COPY_FIELDS.map(([key,,limit])=>[key,z.string().trim().max(limit).optional()])) as Record<RegionalCopyKey,z.ZodOptional<z.ZodString>>;
export const REGIONAL_OPTIONAL_SECTIONS=[['gallery','Regional images'],['locations','Related cities and blood groups'],['faq','Frequently asked questions'],['guidance','Guidance and related reading'],['join','Registration invitation'],['home5','First homepage invitation'],['home9','Second homepage invitation'],['home12','Closing homepage invitation']] as const;
export type RegionalSectionKey=typeof REGIONAL_OPTIONAL_SECTIONS[number][0];
export const RegionalDesignSchema=z.object({
 theme:z.enum(['auto','nepal','india','pakistan','bangladesh','international']).optional(),
 layout:z.enum(['balanced','stacked']).optional(),spacing:z.enum(['comfortable','compact']).optional(),
 colors:z.object({paper:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),ink:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),accent:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),indigo:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional()}).strict().optional(),
 copy:z.object(copyShape).strict().optional(),
 hiddenSections:z.array(z.enum(['gallery','locations','faq','guidance','join','home5','home9','home12'])).max(8).refine(values=>new Set(values).size===values.length,{message:'Choose each section only once.'}).optional(),
 faqs:z.array(z.object({question:z.string().trim().min(5,'FAQ questions need at least 5 characters.').max(200),answer:z.string().trim().min(10,'FAQ answers need at least 10 characters.').max(1200)}).strict()).max(8).optional(),
}).strict();
export type RegionalDesign=z.infer<typeof RegionalDesignSchema>;
export function normalizeRegionalDesign(country:string,input:unknown):RegionalDesign{
 const value=RegionalDesignSchema.parse(input),result:RegionalDesign={};
 if(value.theme&&value.theme!=='auto'&&value.theme!==getRegionalEdition(country).theme)result.theme=value.theme;
 if(value.layout==='stacked')result.layout=value.layout;
 if(value.spacing==='compact')result.spacing=value.spacing;
 if(value.colors){const defaults=resolveRegionalDesign(country,{theme:result.theme}).colors;const colors=Object.fromEntries(Object.entries(value.colors).filter(([key,color])=>color&&color.toLowerCase()!==defaults[key as keyof typeof defaults].toLowerCase()).map(([key,color])=>[key,color!.toLowerCase()]));if(Object.keys(colors).length)result.colors=colors;}
 if(value.copy){const copy=Object.fromEntries(Object.entries(value.copy).filter(([,text])=>text?.trim()));if(Object.keys(copy).length)result.copy=copy;}
 if(value.hiddenSections?.length)result.hiddenSections=[...value.hiddenSections].sort();
 if(value.faqs?.length)result.faqs=value.faqs;
 return result;
}
export const REGIONAL_PALETTES:Record<string,{paper:string;ink:string;accent:string;indigo:string}>={
 nepal:{paper:'#f8f5ee',ink:'#16263e',accent:'#ad2444',indigo:'#293f71'},
 india:{paper:'#fff8f0',ink:'#292b35',accent:'#a3302c',indigo:'#354b41'},
 pakistan:{paper:'#f3f8f5',ink:'#17352d',accent:'#9d2847',indigo:'#245e50'},
 bangladesh:{paper:'#f5f8f4',ink:'#183c35',accent:'#ad2444',indigo:'#17614f'},
 international:{paper:'#f5f6fb',ink:'#20314b',accent:'#ad2444',indigo:'#365274'},
};
export function resolveRegionalDesign(country:string,value?:RegionalDesign){
 const design=value||{},theme=design.theme&&design.theme!=='auto'?design.theme:getRegionalEdition(country).theme;
 return {design,theme,colors:{...(REGIONAL_PALETTES[theme]||REGIONAL_PALETTES.international),...design.colors}};
}
const luminance=(hex:string)=>{const rgb=[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
export function contrastRatio(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function regionalDesignContrastError(country:string,design?:RegionalDesign){
 const {colors}=resolveRegionalDesign(country,design);
 if(luminance(colors.paper)<.7)return 'Choose a light page background so all existing cards and secondary text remain readable.';
 if(contrastRatio(colors.ink,colors.paper)<4.5)return 'Text and background colors need at least 4.5:1 contrast.';
 if(contrastRatio(colors.ink,'#e8ecf2')<4.5||contrastRatio(colors.ink,'#d5dae5')<4.5)return 'Choose darker text so it remains readable on cards and feature panels.';
 if(contrastRatio(colors.accent,colors.paper)<4.5||contrastRatio(colors.accent,'#ffffff')<4.5)return 'Accent color needs at least 4.5:1 contrast with the background and white button text.';
 if(contrastRatio(colors.indigo,'#ffffff')<4.5||contrastRatio(colors.indigo,'#e0e6f2')<4.5)return 'Feature panel color needs at least 4.5:1 contrast with its light text.';
 return null;
}
export function regionalCopy(design:RegionalDesign|undefined,key:RegionalCopyKey,context:{city?:string;country:string;group?:string},fallback:string){
 return formatRegionalText(design?.copy?.[key]||fallback,context);
}
export function formatRegionalText(value:string,context:{city?:string;country:string;group?:string}){return value.replace(/\{(city|country|group)\}/g,(_,token:string)=>token==='city'?(context.city||context.country):token==='group'?(context.group||'blood'):context.country);}
