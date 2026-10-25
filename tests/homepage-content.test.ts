import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HomepageCommandSchema,normalizeHomepageConfig} from '../src/lib/homepageContent';

test('homepage configuration keeps original defaults and normalizes equivalent edits',()=>{
 assert.deepEqual(normalizeHomepageConfig({}),{copy:{},hiddenSections:[]});
 assert.deepEqual(normalizeHomepageConfig({copy:{heroHeading:'  ',ctaText:' Join locally. '},hiddenSections:['faq','about','faq']}),{copy:{ctaText:'Join locally.'},hiddenSections:['about','faq']});
});
test('homepage editing cannot change statistics, donor search, navigation or regional fields',()=>{
 for(const config of [{copy:{donorCount:'12000'}},{hiddenSections:['hero']},{hiddenSections:['navigation']},{country:'India'},{html:'<script/>'},{copy:{heroHeading:'x'.repeat(141)}}])assert.equal(HomepageCommandSchema.safeParse({action:'publish',config}).success,false);
 assert.equal(HomepageCommandSchema.safeParse({action:'delete',config:{}}).success,false);
});
