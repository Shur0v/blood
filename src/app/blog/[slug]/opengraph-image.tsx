import {ImageResponse} from 'next/og';
import {getPrisma} from '@/src/backend/config/db';
export const size={width:1200,height:630};
export const contentType='image/png';
export const dynamic='force-dynamic';
export default async function Image({params}:{params:Promise<{slug:string}>}){
 const post=await getPrisma().blog.findFirst({where:{slug:(await params).slug,status:'PUBLISHED'},select:{title:true}});
 if(!post)return new Response('Article not found',{status:404});
 return new ImageResponse(<div style={{display:'flex',width:'100%',height:'100%',background:'#fff8fa',padding:76,flexDirection:'column',justifyContent:'space-between',borderTop:'16px solid #be123c'}}><div style={{display:'flex',color:'#be123c',fontSize:32}}>BloodNet Journal</div><div style={{display:'flex',fontSize:post&&post.title.length>110?44:56,color:'#172033',fontWeight:700,lineHeight:1.2}}>{post?.title.slice(0,190)||'BloodNet Journal'}</div><div style={{display:'flex',fontSize:24,color:'#64748b'}}>Blood donation · Community · Health</div></div>,size);
}
