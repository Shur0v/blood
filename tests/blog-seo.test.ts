import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareBlogReading,blogCanonical,blogDescription,archivePage,relatedBlogScore} from '../src/lib/blogSeo';
test('article navigation preserves content, gives headings stable IDs and sanitizes unsafe markup',()=>{
 const input='<h1>A real article</h1><p>Original paragraph.</p><h2>Next &amp; useful</h2><h3>Details</h3><script>alert(1)</script><a href="javascript:alert(1)">bad link</a>';
 const result=prepareBlogReading(input);assert.equal(result.headings.length,3);assert.equal(result.headings[1].title,'Next & useful');assert.ok(result.html.includes('Original paragraph.'));assert.ok(!result.html.includes('<h1'));assert.ok(!result.html.includes('<script'));assert.ok(!result.html.includes('javascript:'));assert.deepEqual(prepareBlogReading(input).headings,result.headings);
});
test('plain article text stays escaped and count/time use actual text',()=>{
 const result=prepareBlogReading('## Heading\n\n'+Array(450).fill('donation').join(' '));assert.equal(result.headings[0].title,'Heading');assert.equal(result.readingMinutes,3);assert.ok(result.html.includes('<p>donation'));assert.equal(prepareBlogReading('2 < 3 & 4 > 1').html,'<p>2 &lt; 3 &amp; 4 &gt; 1</p>');
});
test('canonical fallback rejects script URLs and descriptions contain readable plain text',()=>{
 assert.equal(blogCanonical('real-post','javascript:alert(1)','https://bloodnet.live'),'https://bloodnet.live/blog/real-post');assert.equal(blogCanonical('real-post','https://source.example/original#part','https://bloodnet.live'),'https://source.example/original');assert.equal(blogDescription('<p>Useful &amp; factual content.</p>'),'Useful & factual content.');assert.ok(blogDescription('A useful description '.repeat(40)).length<=170);
});
test('archive pages normalize safely and related reading rewards relevant terms',()=>{
 for(const page of ['-1','broken','Infinity','999999999999'])assert.equal(archivePage(page),1);assert.equal(archivePage('21'),21);assert.ok(relatedBlogScore('blood group testing','Understanding blood group testing')>relatedBlogScore('blood group testing','A different unrelated article'));
});
