import {z} from 'zod';

export const HOME_COPY_FIELDS = [
 ['heroHeading','Donor search heading',140],['heroDescription','Donor search description',700],
 ['processTitle','How it works heading',140],
 ['reminderTitle','Registration heading',140],['reminderSubtitle','Registration subtitle',300],['reminderText','Registration description',700],['reminderButton','Registration button',60],
 ['aboutTitle','About heading',140],['aboutSubtitle','About subtitle',300],['aboutText','About description',1200],
 ['faqTitle','FAQ heading',140],['faqText','FAQ introduction',700],
 ['ctaTitle','Final invitation heading',140],['ctaSubtitle','Final invitation subtitle',200],['ctaText','Final invitation description',700],['ctaButton','Final invitation button',60],
] as const;
export const HOME_OPTIONAL_SECTIONS = [
 ['process','How it works'],['reminder','Registration reminder'],['slider','Image slider'],['fund','Medical aid fund'],['about','About BloodNet'],['activity','Donor activity'],['impact','Network statistics'],['organRequest','Organ request form'],['stories','Community stories'],['reports','Community guardian'],['mobile','Mobile app preview'],['faq','Frequently asked questions'],['cta','Final registration invitation'],['social','Community links'],['contact','Contact form'],
] as const;
export type HomeCopyKey=typeof HOME_COPY_FIELDS[number][0];
export type HomeSection=typeof HOME_OPTIONAL_SECTIONS[number][0];
export const HomepageConfigSchema=z.object({
 copy:z.object(Object.fromEntries(HOME_COPY_FIELDS.map(([key,,max])=>[key,z.string().trim().max(max).optional()])) as Record<HomeCopyKey,z.ZodOptional<z.ZodString>>).strict().default({}),
 hiddenSections:z.array(z.enum(HOME_OPTIONAL_SECTIONS.map(([key])=>key) as [HomeSection,...HomeSection[]])).max(HOME_OPTIONAL_SECTIONS.length).default([]),
}).strict();
export type HomepageConfig=z.infer<typeof HomepageConfigSchema>;
export const HomepageCommandSchema=z.object({action:z.enum(['draft','publish','restore']),config:HomepageConfigSchema}).strict();
export function normalizeHomepageConfig(input:unknown):HomepageConfig {
 const value=HomepageConfigSchema.parse(input);
 return {copy:Object.fromEntries(HOME_COPY_FIELDS.flatMap(([key])=>value.copy[key]?[[key,value.copy[key]]]:[])),hiddenSections:[...new Set(value.hiddenSections)].sort()};
}
