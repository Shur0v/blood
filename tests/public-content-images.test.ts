import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isPublicImageAddress,validateRemoteImageUrl} from '../src/backend/services/remoteImage';
import {PublicImageMetadataSchema,PublicImagePlacementSchema,imageFilename} from '../src/lib/publicImages';
import {ContentCommandSchema,AvailabilityCommandSchema} from '../src/lib/publicServices';
import {articleNextStep} from '../src/lib/articleContext';
test('article invitations follow their subject without confusing organ donors with blood donors',()=>{
 assert.equal(articleNextStep('Organ donors and transplant coordination').href,'/organ-donation-ethics');
 assert.equal(articleNextStep('Blood donor preparation').href,'/blood');
 assert.equal(articleNextStep('Understanding a ferritin laboratory report').href,'/medical-reports');
 assert.equal(articleNextStep('Warfarin prescription history').href,'/prescriptions');
});
test('remote image imports exclude internal, special and transition networks',()=>{
 for(const value of ['127.0.0.1','10.1.2.3','172.16.1.2','192.168.1.2','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::1','::','fe80::1','fc00::1','::ffff:127.0.0.1','2001:db8::1','2002:7f00:1::'])assert.equal(isPublicImageAddress(value),false,value);
 for(const value of ['1.1.1.1','8.8.8.8','2606:4700:4700::1111'])assert.equal(isPublicImageAddress(value),true,value);
 for(const value of ['http://example.com/a.jpg','file:///a','https://user:secret@example.com/a.jpg','https://localhost/a','https://example.com:8443/a.jpg','https://example.com/a#fragment'])assert.throws(()=>validateRemoteImageUrl(value));
 assert.equal(validateRemoteImageUrl('https://example.com/image.webp').hostname,'example.com');
});
test('public image metadata requires rights and informative or decorative alt text',()=>{
 assert.equal(PublicImageMetadataSchema.safeParse({filename:'blood-donation',rightsConfirmed:false}).success,false);
 const assetId='00000000-0000-4000-8000-000000000001';assert.equal(PublicImagePlacementSchema.safeParse({assetId,alt:''}).success,false);assert.equal(PublicImagePlacementSchema.safeParse({assetId,alt:'',decorative:true}).success,true);
 assert.equal(imageFilename(' Kathmandu: community / event! '),'kathmandu-community-event');
});
test('public editors reject arbitrary keys, unsafe links and unverified service destinations',()=>{
 assert.equal(ContentCommandSchema.safeParse({key:'private-profile',action:'publish',content:{}}).success,false);
 assert.equal(ContentCommandSchema.safeParse({key:'medical-profile',action:'publish',content:{sections:[{title:'Useful details',body:'A useful explanation of your profile.',link:'//external.invalid'}]}}).success,false);
 assert.equal(AvailabilityCommandSchema.safeParse({country:'Nepal',action:'publish',availability:{booking:{url:'http://provider.invalid',label:'Book',verifiedOn:'2026-01-01',verificationNote:'Checked provider coverage.'}}}).success,false);
 assert.equal(AvailabilityCommandSchema.safeParse({country:'Nepal',action:'publish',availability:{booking:{url:'https://provider.invalid',label:'Book',verifiedOn:'2099-01-01',verificationNote:'Checked provider coverage.'}}}).success,false);
});
