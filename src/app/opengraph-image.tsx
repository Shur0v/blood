import { ImageResponse } from 'next/og';
export const alt = 'BloodNet — find blood and organ donors by location';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',padding:80,background:'linear-gradient(135deg, #fff1f2 0%, #ffffff 65%, #f1f5f9 100%)',color:'#0f172a',fontFamily:'sans-serif'}}><div style={{display:'flex',alignItems:'center',fontSize:36,color:'#be123c',marginBottom:32}}>BloodNet</div><div style={{fontSize:72,fontWeight:700,lineHeight:1.1}}>Find a donor.</div><div style={{fontSize:72,fontWeight:700,lineHeight:1.1,color:'#be123c'}}>Connect with care.</div><div style={{fontSize:28,color:'#475569',marginTop:36}}>Blood groups · Cities · Organ donor pledges</div><div style={{fontSize:24,color:'#475569',marginTop:20}}>Free volunteer donor directory</div></div>,size);
}
