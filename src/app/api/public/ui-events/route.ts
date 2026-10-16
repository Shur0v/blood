import {getUiControls,subscribeUiControls} from '@/src/backend/services/uiControls';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(req:Request){
  const encoder=new TextEncoder();let cleanup:undefined|(()=>void),heartbeat:ReturnType<typeof setInterval>|undefined,closed=false;
  const finish=()=>{if(closed)return;closed=true;cleanup?.();if(heartbeat)clearInterval(heartbeat);};
  const body=new ReadableStream({async start(controller){
    const send=(text:string)=>{if(!closed)try{controller.enqueue(encoder.encode(text));}catch{finish();}};
    let pending=Promise.resolve(),lastSent='';
    const refresh=()=>{pending=pending.then(async()=>{if(closed)return;const value=JSON.stringify(await getUiControls());if(value!==lastSent){send(`data: ${value}\n\n`);lastSent=value;}}).catch(()=>{/* Reconnection retains the last known setting. */});return pending;};
    req.signal.addEventListener('abort',()=>{finish();try{controller.close();}catch{}},{once:true});
    if(req.signal.aborted){finish();controller.close();return;}
    send('retry: 5000\n\n');
    const unsubscribe=await subscribeUiControls(()=>{void refresh();});
    if(closed){unsubscribe();return;}cleanup=unsubscribe;
    await refresh();if(!closed)heartbeat=setInterval(()=>send(': heartbeat\n\n'),25000);
  },cancel(){finish();}});
  return new Response(body,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-store, no-transform','X-Accel-Buffering':'no','Connection':'keep-alive'}});
}
