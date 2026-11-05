import {z} from 'zod';
import {PublicImagePlacementSchema} from './publicImages';

export const USA_COUNTRY='United States';
export const USA_REVIEW_DATE='2026-11-05';
export const USA_MAIN_IDS=['hero','coverage','participation','search','results','locations','benefits','signup','matching','availability','privacy','preparation','sources','profile','reports','prescriptions','donation','community','questions','closing'] as const;
export const USA_FAMILIES={
  orientation:['area-introduction','state-city','location-explorer','coverage-context','starting-point'],
  motivation:['participation-gap','contribution-checklist','account-benefits','registration-questions','first-registration'],
  discovery:['search-walkthrough','source-comparison','broader-flow','group-navigation','reading-results'],
  preparation:['hospital-checklist','first-call','scheduling','travel','confirmation'],
  privacy:['public-private','contact-choices','availability-control','service-cities','consent'],
  records:['profile-preview','report-organization','timeline','prescription-context','appointment-preparation'],
  community:['individuals','families','students','workplaces','organizers'],
  evidence:['official-resources','source-notes','coverage-definitions','reviewed-guidance','myth-fact'],
  exploration:['nearby-cities','state-connections','group-links','reading-links','next-step'],
  action:['local-questions','concerns','signup-checklist','account-maintenance','local-closing'],
} as const;
export const USA_LOCAL_IDS=Object.values(USA_FAMILIES).flat();
export type UsaLocalId=typeof USA_LOCAL_IDS[number];
export type UsaMainId=typeof USA_MAIN_IDS[number];
export type UsaArea={id:string;kind:'state'|'city';slug:string;name:string;state:string;stateCode:string;path:string;directoryCities:string[];source:string;context:string;recipe:UsaLocalId[]};

// Reviewed, explicit recipes. They do not depend on a request, visitor or random seed.
export const USA_AREAS:UsaArea[]=[
 {id:'california',kind:'state',slug:'california',name:'California',state:'California',stateCode:'CA',path:'/us/states/california',directoryCities:['Los Angeles','San Francisco','San Diego'],source:'https://www.ca.gov/',context:'This state overview groups only the reviewed Los Angeles, San Francisco and San Diego mappings. It does not represent every California city or statewide clinical coverage.',recipe:['state-city','participation-gap','hospital-checklist','public-private','profile-preview','organizers','official-resources','state-connections','local-questions']},
 {id:'las-vegas',kind:'city',slug:'las-vegas',name:'Las Vegas',state:'Nevada',stateCode:'NV',path:'/us/cities/las-vegas',directoryCities:['Las Vegas'],source:'https://www.lasvegasnevada.gov/',context:'Las Vegas is presented as a city in Nevada. This page does not combine neighboring communities or the entire Las Vegas Valley into one local donor count.',recipe:['area-introduction','first-registration','source-comparison','first-call','contact-choices','timeline','individuals','source-notes','local-closing']},
 {id:'los-angeles',kind:'city',slug:'los-angeles',name:'Los Angeles',state:'California',stateCode:'CA',path:'/us/cities/los-angeles',directoryCities:['Los Angeles'],source:'https://lacity.gov/',context:'Los Angeles city listings are kept separate from the wider county. Confirm the collecting facility and travel arrangements rather than assuming a city label means a nearby contact.',recipe:['location-explorer','account-benefits','search-walkthrough','travel','consent','report-organization','families','coverage-definitions','concerns']},
 {id:'san-francisco',kind:'city',slug:'san-francisco',name:'San Francisco',state:'California',stateCode:'CA',path:'/us/cities/san-francisco',directoryCities:['San Francisco'],source:'https://www.sf.gov/',context:'San Francisco is not used as a label for the whole Bay Area. Other cities remain separately identified on directory cards and related-location links.',recipe:['coverage-context','contribution-checklist','broader-flow','scheduling','availability-control','prescription-context','students','reviewed-guidance','signup-checklist']},
 {id:'san-diego',kind:'city',slug:'san-diego',name:'San Diego',state:'California',stateCode:'CA',path:'/us/cities/san-diego',directoryCities:['San Diego'],source:'https://www.sandiego.gov/',context:'This page concerns San Diego city entries. A county-wide or cross-border connection is not counted as local city participation without an explicit reviewed mapping.',recipe:['starting-point','registration-questions','group-navigation','confirmation','service-cities','appointment-preparation','workplaces','myth-fact','account-maintenance']},
 {id:'new-york-city',kind:'city',slug:'new-york-city',name:'New York City',state:'New York',stateCode:'NY',path:'/us/cities/new-york-city',directoryCities:['New York','New York City'],source:'https://www.nyc.gov/',context:'Reviewed New York and New York City directory labels refer to this city overview, not all of New York State. Borough-specific availability must still be confirmed on the contact record.',recipe:['area-introduction','participation-gap','reading-results','hospital-checklist','public-private','profile-preview','families','official-resources','nearby-cities']},
 {id:'chicago',kind:'city',slug:'chicago',name:'Chicago',state:'Illinois',stateCode:'IL',path:'/us/cities/chicago',directoryCities:['Chicago'],source:'https://www.chicago.gov/',context:'Chicago city coverage is separate from surrounding municipalities. Use the displayed contact location and confirm the actual facility before arranging travel.',recipe:['state-city','first-registration','search-walkthrough','first-call','contact-choices','timeline','organizers','source-notes','state-connections']},
 {id:'houston',kind:'city',slug:'houston',name:'Houston',state:'Texas',stateCode:'TX',path:'/us/cities/houston',directoryCities:['Houston'],source:'https://www.houstontx.gov/',context:'Houston entries are city-labelled contacts, not a metro-wide inventory. A service-city choice indicates participation and does not establish transport or same-day availability.',recipe:['location-explorer','account-benefits','source-comparison','travel','availability-control','report-organization','individuals','coverage-definitions','group-links']},
 {id:'dallas',kind:'city',slug:'dallas',name:'Dallas',state:'Texas',stateCode:'TX',path:'/us/cities/dallas',directoryCities:['Dallas'],source:'https://dallascityhall.com/',context:'Dallas is not combined with Fort Worth or other cities into one local total. Broader suggestions retain their own locations and should be considered with your collecting service.',recipe:['coverage-context','contribution-checklist','broader-flow','scheduling','consent','prescription-context','workplaces','reviewed-guidance','reading-links']},
 {id:'miami',kind:'city',slug:'miami',name:'Miami',state:'Florida',stateCode:'FL',path:'/us/cities/miami',directoryCities:['Miami'],source:'https://www.miami.gov/',context:'Miami city entries are not automatically Miami-Dade County coverage. Confirm the collection address, contact details and relevant service requirements directly.',recipe:['starting-point','registration-questions','reading-results','confirmation','service-cities','appointment-preparation','students','myth-fact','next-step']},
 {id:'atlanta',kind:'city',slug:'atlanta',name:'Atlanta',state:'Georgia',stateCode:'GA',path:'/us/cities/atlanta',directoryCities:['Atlanta'],source:'https://www.atlantaga.gov/',context:'Atlanta city listings remain distinct from the larger metropolitan area. A broader contact can be useful without being described as a local or confirmed match.',recipe:['area-introduction','account-benefits','group-navigation','hospital-checklist','contact-choices','timeline','families','official-resources','account-maintenance']},
 {id:'seattle',kind:'city',slug:'seattle',name:'Seattle',state:'Washington',stateCode:'WA',path:'/us/cities/seattle',directoryCities:['Seattle'],source:'https://www.seattle.gov/',context:'Seattle is identified as a Washington city, not a statewide directory. Related cities and collecting services keep their own identities and contact arrangements.',recipe:['state-city','participation-gap','broader-flow','travel','public-private','report-organization','organizers','source-notes','concerns']},
 {id:'boston',kind:'city',slug:'boston',name:'Boston',state:'Massachusetts',stateCode:'MA',path:'/us/cities/boston',directoryCities:['Boston'],source:'https://www.boston.gov/',context:'Boston listings are not treated as all Greater Boston communities. Review the city on each record and agree the hospital destination and timing before travel.',recipe:['location-explorer','first-registration','reading-results','first-call','availability-control','profile-preview','students','coverage-definitions','local-closing']},
 {id:'phoenix',kind:'city',slug:'phoenix',name:'Phoenix',state:'Arizona',stateCode:'AZ',path:'/us/cities/phoenix',directoryCities:['Phoenix'],source:'https://www.phoenix.gov/',context:'Phoenix city entries do not imply coverage throughout the Valley or Arizona. Confirm distance and practical arrangements; a directory entry is not a guaranteed available donation.',recipe:['coverage-context','registration-questions','source-comparison','confirmation','consent','prescription-context','individuals','reviewed-guidance','signup-checklist']},
];
export const USA_RESOURCES=[
 {id:'fda',label:'FDA: how blood donation works',url:'https://www.fda.gov/consumers/consumer-updates/have-you-given-blood-lately'},
 {id:'red-cross',label:'American Red Cross: donor eligibility',url:'https://www.redcrossblood.org/donate-blood/how-to-donate/eligibility-requirements/eligibility-criteria-alphabetical.html'},
 {id:'prepare',label:'American Red Cross: preparing to donate',url:'https://www.redcrossblood.org/donate-blood/blood-donation-process/before-during-after.html'},
] as const;
export const usaArea=(id:string)=>USA_AREAS.find(area=>area.id===id);
export const UsaRecipeSchema=z.array(z.enum(USA_LOCAL_IDS as [UsaLocalId,...UsaLocalId[]])).length(9).refine(ids=>new Set(ids).size===9,'Choose nine different area components.');
const plainText=(max:number)=>z.string().trim().max(max).refine(value=>!/<\/?[a-z][^>]*>/i.test(value),'Use plain text, not HTML markup.');
const SectionOverrideSchema=z.object({title:plainText(160).optional(),text:plainText(900).optional(),variant:z.enum(['default','reverse','blue','red','soft']).optional(),hidden:z.boolean().optional()}).strict();
export const UsaConfigSchema=z.object({
 title:plainText(160).optional(),introduction:plainText(1200).optional(),
 recipe:UsaRecipeSchema.optional(),
 sections:z.record(z.string(),SectionOverrideSchema).refine(value=>Object.keys(value).every(id=>[...USA_MAIN_IDS,...USA_LOCAL_IDS].includes(id as never)),'Unknown USA section.').optional(),
 resources:z.array(z.enum(['fda','red-cross','prepare'])).max(3).refine(ids=>new Set(ids).size===ids.length).optional(),
 editorialNote:plainText(1400).optional(),
 images:z.array(PublicImagePlacementSchema).max(2).optional(),
}).strict().refine(config=>!['hero','search','results'].some(id=>config.sections?.[id]?.hidden),'Introduction, search and results cannot be hidden.');
export type UsaConfig=z.infer<typeof UsaConfigSchema>;
export const UsaCommandSchema=z.object({areaId:z.string().refine(id=>id==='country'||Boolean(usaArea(id)),'Choose a curated USA area.'),action:z.enum(['draft','publish','withdraw','restore']),config:UsaConfigSchema}).strict();
