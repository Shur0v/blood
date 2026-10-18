import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd(),false);
const {getPrisma}=await import('../config/db');
const {prepareBlogReading,blogCanonical}=await import('../../lib/blogSeo');
const base=process.env.NEXT_PUBLIC_BASE_URL||'https://bloodnet.live';
const prisma=getPrisma();
try{
 const rows=await prisma.blog.findMany({where:{status:'PUBLISHED'},select:{slug:true,title:true,content:true,meta_description:true,seo_desc:true,canonical_url:true}});
 const canonicals=new Map<string,string[]>(),issues:Array<{path:string|null;issues:string[]}>=[];
 for(const row of rows){const reading=prepareBlogReading(row.content),flags:string[]=[];
  if(!row.slug)flags.push('No public slug: review in blog editor');
  if(!row.meta_description&&!row.seo_desc)flags.push('Using automatic description: review for search intent');
  if(reading.headings.length===0)flags.push('No section headings: consider editorial headings');
  if(!/href=["']https?:\/\//i.test(reading.html))flags.push('No external references linked: review factual sourcing');
  if(row.slug){const canonical=blogCanonical(row.slug,row.canonical_url,base),paths=canonicals.get(canonical)||[];paths.push('/blog/'+row.slug);canonicals.set(canonical,paths);}
  if(flags.length)issues.push({path:row.slug?'/blog/'+row.slug:null,issues:flags});
 }
 console.log(JSON.stringify({publishedArticles:rows.length,articlesWithReviewNotes:issues.length,duplicateCanonicals:[...canonicals.entries()].filter(([,paths])=>paths.length>1).map(([canonical,paths])=>({canonical,paths})),reviewNotes:issues},null,2));
}finally{await prisma.$disconnect();}
