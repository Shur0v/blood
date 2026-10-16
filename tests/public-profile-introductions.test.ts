import {test} from 'node:test';import assert from 'node:assert/strict';import {donorIntroductions,defaultIntroductionIndex,INTRODUCTION_TITLES} from '../src/lib/publicProfileIntroductions';
test('ten distinct introductions use only the public donor fields and stay near 100 words',()=>{
 const profile={name:'Demo Donor',bloodGroup:'O-',city:'Dhaka',country:'Bangladesh',email:'private@example.invalid',mobile:'+8801712345678',healthData:'private diagnosis'};
 const bios=donorIntroductions(profile);assert.equal(bios.length,10);assert.equal(new Set(bios).size,10);assert.equal(INTRODUCTION_TITLES.length,10);
 for(const bio of bios){for(const value of [profile.name,profile.city,profile.country,profile.bloodGroup])assert.ok(bio.includes(value));assert.ok(bio.split(/\s+/).length>=95&&bio.split(/\s+/).length<=115);assert.ok(bio.length<=1200);for(const value of [profile.email,profile.mobile,profile.healthData])assert.ok(!bio.includes(value));}
 assert.equal(defaultIntroductionIndex('same-account'),defaultIntroductionIndex('same-account'));assert.equal(new Set(Array.from({length:100},(_,i)=>defaultIntroductionIndex('account-'+i))).size,10);
 for(const bio of donorIntroductions({name:profile.email,city:profile.mobile}))assert.ok(!bio.includes(profile.email)&&!bio.includes(profile.mobile));
});
