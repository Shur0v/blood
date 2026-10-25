import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blogPageLastModified,publicBlogUrl,renderBlogFeed} from '../src/lib/blogDiscovery';
import {BLOG_PAGE_SIZE} from '../src/lib/blogArchive';
import {generateKeyPairSync,createVerify} from 'node:crypto';
import {notifyGoogleBlogs} from '../src/backend/services/googleBlogDiscovery';

test('97 articles occupy 40, 40 and 17 slots without overlaps',()=>{
 const ids=Array.from({length:97},(_,i)=>i+1);
 const pages=[0,1,2].map(page=>ids.slice(page*BLOG_PAGE_SIZE,(page+1)*BLOG_PAGE_SIZE));
 assert.deepEqual(pages.map(page=>page.length),[40,40,17]);
 assert.equal(pages[1][0],41);assert.equal(pages[2][0],81);
 assert.deepEqual(pages.flat(),ids);
});
test('sitemap dates reflect meaningful page changes without changing article dates',()=>{
 const old=new Date('2026-05-31T00:00:00Z');
 assert.equal(blogPageLastModified(old).toISOString(),'2026-10-25T18:15:03.000Z');
 assert.equal(old.toISOString(),'2026-05-31T00:00:00.000Z');
 const edited=new Date('2026-10-26T15:00:00Z');assert.equal(blogPageLastModified(edited).toISOString(),edited.toISOString());
});
test('canonical aliases and external destinations stay out of blog discovery',()=>{
 const base='https://bloodnet.live';
 assert.equal(publicBlogUrl({slug:'a'},base),base+'/blog/a');
 assert.equal(publicBlogUrl({slug:'a',canonical_url:'/blog/a'},base),base+'/blog/a');
 assert.equal(publicBlogUrl({slug:'a',canonical_url:'/blog/b'},base),null);
 assert.equal(publicBlogUrl({slug:'a',canonical_url:'https://example.org/a'},base),null);
 assert.equal(publicBlogUrl({slug:''},base),null);
});
test('Atom discovery includes all 97 canonical URLs, escapes XML and retains publication dates',()=>{
 const date=new Date('2026-05-31T00:00:00Z');
 const posts=Array.from({length:97},(_,i)=>({slug:'article-'+i,title:'Health & "care" <guide>',content:'<p>Clear & safe text.</p>',meta_description:null,published_at:date,created_at:date,updated_at:date}));
 const feed=renderBlogFeed(posts,'https://bloodnet.live');
 assert.equal((feed.match(/<entry>/g)||[]).length,97);
 assert.equal((feed.match(/<published>2026-05-31T00:00:00.000Z<\/published>/g)||[]).length,97);
 assert.match(feed,/Health &amp; &quot;care&quot; &lt;guide&gt;/);
 assert.ok(!feed.includes('<p>'));assert.ok(!feed.includes('author_id'));
 assert.equal((renderBlogFeed([...posts,{...posts[0],canonical_url:'/blog/another'}],'https://bloodnet.live').match(/<entry>/g)||[]).length,97);
});

test('Google notifications authenticate with a short-lived signed JWT and submit only site sitemaps',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const credentials={type:'service_account',client_email:'test@example.invalid',private_key:privateKey.export({type:'pkcs8',format:'pem'}).toString()};
 const calls:string[]=[];
 const request=(async(input: string|URL|Request,init?:RequestInit)=>{
  const url=String(input);calls.push(url);
  if(url==='https://oauth2.googleapis.com/token'){
   const params=init!.body as URLSearchParams;const [header,payload,signature]=params.get('assertion')!.split('.');
   assert.ok(createVerify('RSA-SHA256').update(header+'.'+payload).verify(publicKey,signature,'base64url'));
   const claims=JSON.parse(Buffer.from(payload,'base64url').toString());assert.equal(claims.exp-claims.iat,300);assert.equal(claims.aud,url);
   return Response.json({access_token:'synthetic-only'});
  }
  assert.equal(init!.method,'PUT');assert.equal((init!.headers as Record<string,string>).Authorization,'Bearer synthetic-only');
  return new Response(null,{status:204});
 }) as typeof fetch;
 assert.deepEqual(await notifyGoogleBlogs('https://bloodnet.live',undefined,credentials,request),['https://bloodnet.live/sitemap-blog.xml','https://bloodnet.live/blog/feed.xml']);
 assert.equal(calls.length,3);assert.ok(calls.slice(1).every(url=>url.startsWith('https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Abloodnet.live/sitemaps/')));
 await assert.rejects(notifyGoogleBlogs('https://bloodnet.live','sc-domain:wrong.test',credentials,request),/must match/);assert.equal(calls.length,3);
 await assert.rejects(notifyGoogleBlogs('https://bloodnet.live',undefined,credentials,async()=>new Response('secret error body',{status:403})),error=>error instanceof Error&&error.message.includes('HTTP 403')&&!error.message.includes('secret error body'));
});
