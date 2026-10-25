import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RegionalContentSchema} from '../src/lib/regionalContent';
import {regionalLastModified} from '../src/backend/services/regionalContent';
import {GLOBAL_CITY_REVISION} from '../src/lib/regionalContent';
import {getRegionalEdition} from '../src/lib/regionalEdition';
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
test('regional sitemap dates follow city publication across countries without changing unmodified country pages',()=>{
 const old=new Date('2020-01-01'),country=new Date('2028-03-01'),city=new Date('2028-02-01');
 const dates=new Map([['nepal:*',{updatedAt:country,published:true}],['nepal:kathmandu',{updatedAt:city,published:true}]]);
 assert.equal(regionalLastModified('Nepal','Kathmandu',old,dates).toISOString(),city.toISOString(),'A city override does not inherit hidden country edits');
 dates.set('nepal:kathmandu',{updatedAt:city,published:false});
 assert.equal(regionalLastModified('Nepal','Kathmandu',old,dates).toISOString(),country.toISOString(),'Withdrawn overrides fall back to country content');
 assert.equal(regionalLastModified('India','Delhi',old,dates).toISOString(),new Date(GLOBAL_CITY_REVISION).toISOString());
 assert.equal(regionalLastModified('India',undefined,old,dates).toISOString(),old.toISOString());
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
