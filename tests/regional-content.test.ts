import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RegionalContentSchema} from '../src/lib/regionalContent';
import {regionalLastModified} from '../src/backend/services/regionalContent';
import {GLOBAL_CITY_REVISION} from '../src/lib/regionalContent';
import {getRegionalEdition} from '../src/lib/regionalEdition';
import {RegionalDesignSchema,REGIONAL_PALETTES,regionalDesignContrastError,regionalCopy,normalizeRegionalDesign} from '../src/lib/regionalDesign';
const draft={country:'Nepal',city:null,title:'',summary:'',slides:[],published:false};
test('regional updates distinguish drafts from publishable text and bound gallery size',()=>{
 assert.ok(RegionalContentSchema.safeParse(draft).success);
 assert.ok(!RegionalContentSchema.safeParse({...draft,published:true}).success);
 assert.ok(RegionalContentSchema.safeParse({...draft,published:true,title:'A community update',summary:'A reviewed description.'}).success);
 const slide={assetId:'00000000-0000-4000-8000-000000000001',alt:'A local community event',caption:'Real photo caption',credit:'Photo owner',sourceUrl:'https://example.org/report',eventDate:'2026-10-25'};
 assert.ok(RegionalContentSchema.safeParse({...draft,slides:[slide]}).success);
 for(const patch of [{alt:''},{credit:''},{sourceUrl:'not a URL'},{sourceUrl:'javascript:alert(1)'},{sourceUrl:'https://user:password@example.org/'},{eventDate:'2026-02-31'}])assert.ok(!RegionalContentSchema.safeParse({...draft,slides:[{...slide,...patch}]}).success);
 assert.ok(!RegionalContentSchema.safeParse({...draft,slides:Array(7).fill(slide)}).success);
 assert.ok(!RegionalContentSchema.safeParse({...draft,administrator:true}).success);
});
test('regional sitemap dates follow city and country publication including new service content',()=>{
 const old=new Date('2020-01-01'),country=new Date('2028-03-01'),city=new Date('2028-02-01');
 const dates=new Map([['nepal:*',{updatedAt:country,published:true}],['nepal:kathmandu',{updatedAt:city,published:true}]]);
 assert.equal(regionalLastModified('Nepal','Kathmandu',old,dates).toISOString(),city.toISOString(),'A city override does not inherit hidden country edits');
 dates.set('nepal:kathmandu',{updatedAt:city,published:false});
 assert.equal(regionalLastModified('Nepal','Kathmandu',old,dates).toISOString(),country.toISOString(),'Withdrawn overrides fall back to country content');
 assert.equal(regionalLastModified('India','Delhi',old,dates).toISOString(),new Date(GLOBAL_CITY_REVISION).toISOString());
 assert.equal(regionalLastModified('India',undefined,old,dates).toISOString(),new Date(GLOBAL_CITY_REVISION).toISOString());
 dates.set('india:*',{updatedAt:country,published:true});
 assert.equal(regionalLastModified('India','Delhi',old,dates).toISOString(),country.toISOString());
});
test('country editions use real country links and never send other countries to Nepal',()=>{
 for(const [country,path,theme] of [['India','/india','india'],['Pakistan','/pakistan','pakistan'],['Bangladesh','/bangladesh','bangladesh'],['Nepal','/nepal','nepal'],['United States','/us','international'],['Kenya','/network/kenya','international']]){
  const edition=getRegionalEdition(country);
  assert.equal(edition.countryPath,path);assert.equal(edition.theme,theme);
  assert.equal(edition.coveragePath,'/network/'+edition.countrySlug);
 }
});
test('regional design accepts bounded copy and readable palettes while protecting core sections',()=>{
 for(const theme of Object.keys(REGIONAL_PALETTES))assert.equal(regionalDesignContrastError('India',{theme:theme as 'india'}),null,theme);
 assert.ok(RegionalDesignSchema.safeParse({theme:'india',layout:'stacked',copy:{introTitle:'Donors in {city}'},hiddenSections:['home5'],faqs:[{question:'How can I search?',answer:'Use the city and group filters above.'}]}).success);
 for(const design of [{colors:{accent:'red;display:none'}},{hiddenSections:['donors']},{hiddenSections:['faq','faq']},{registeredAccounts:90000},{copy:{introTitle:'x'.repeat(181)}},{faqs:[{question:'Short',answer:'tiny'}]}])assert.equal(RegionalDesignSchema.safeParse(design).success,false);
 assert.match(regionalDesignContrastError('India',{colors:{accent:'#ffffff'}})!,/Accent/);
 assert.match(regionalDesignContrastError('India',{colors:{paper:'#000000'}})!,/light page background/);
 assert.match(regionalDesignContrastError('India',{colors:{indigo:'#707070'}})!,/Feature panel/);
 assert.equal(regionalCopy({copy:{introTitle:'{group} volunteers in {city}, {country}'}},'introTitle',{country:'India',city:'Chennai',group:'A+'},'Default'),'A+ volunteers in Chennai, India');
 assert.equal(regionalCopy(undefined,'joinTitle',{country:'India'},'Original title'),'Original title');
 assert.deepEqual(normalizeRegionalDesign('India',{theme:'auto',layout:'balanced',spacing:'comfortable',copy:{introTitle:''},hiddenSections:[],faqs:[],colors:{paper:'#FFF8F0'}}),{},'Default-equivalent fields do not create artificial publication edits');
});
