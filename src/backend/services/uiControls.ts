import {Client} from 'pg';
import {getPrisma} from '../config/db';

export async function getUiControls(){
  const row=await getPrisma().platformSettings.findFirst({orderBy:[{updated_at:'desc'},{id:'desc'}],select:{discovery_visible:true,patient_id_visible:true,city_donation_request_visible:true}});
  return {discoveryVisible:row?.discovery_visible??true,patientIdVisible:row?.patient_id_visible??false,cityDonationRequestVisible:row?.city_donation_request_visible??false};
}
type Listener=(value:{discoveryVisible?:boolean;patientIdVisible?:boolean;cityDonationRequestVisible?:boolean}|null)=>void;
type Hub={listeners:Set<Listener>;client:Client|null;retry:ReturnType<typeof setTimeout>|null;connecting:Promise<void>|null};
const globals=globalThis as typeof globalThis&{bloodnetUiHub?:Hub};
const hub=globals.bloodnetUiHub??={listeners:new Set(),client:null,retry:null,connecting:null};
async function connect(){
  if(hub.connecting)return hub.connecting;
  if(hub.client||!hub.listeners.size)return;
  hub.connecting=(async()=>{
    const client=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});hub.client=client;
    const lost=()=>{if(hub.client!==client)return;hub.client=null;void client.end().catch(()=>{});if(hub.listeners.size&&!hub.retry){hub.retry=setTimeout(()=>{hub.retry=null;void connect();},5000);hub.retry.unref?.();}};
    client.on('error',lost);client.on('end',lost);
    client.on('notification',message=>{if(message.channel!=='bloodnet_ui_controls')return;try{const value=JSON.parse(message.payload||'');if(typeof value.discoveryVisible==='boolean'||typeof value.patientIdVisible==='boolean'||typeof value.cityDonationRequestVisible==='boolean')for(const listener of hub.listeners)listener(value);}catch{/* Invalid notifications carry no public data. */}});
    try{await client.connect();await client.query('LISTEN bloodnet_ui_controls');for(const listener of hub.listeners)listener(null);}catch{lost();}
  })().finally(()=>{hub.connecting=null;});
  return hub.connecting;
}
export async function subscribeUiControls(listener:Listener){
  hub.listeners.add(listener);await connect();
  return ()=>{hub.listeners.delete(listener);if(!hub.listeners.size){if(hub.retry)clearTimeout(hub.retry);hub.retry=null;const client=hub.client;hub.client=null;if(client)void client.end().catch(()=>{});}};
}
