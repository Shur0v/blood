'use client';
import {useEffect,useState} from 'react';
type Network={totalRegisteredAccounts:number;activeCountries:number;activeCities:number;totalListingCount:number};
let pending:Promise<Network|null>|null=null;
export default function usePublicNetwork(){const [network,setNetwork]=useState<Network|null>(null);useEffect(()=>{let active=true;const initial=(window as any).__BLOODNET_PUBLIC_STATS__;if(initial&&typeof initial.totalRegisteredAccounts==='number'){setNetwork(initial);return;}pending??=fetch('/api/public/platform-stats',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(body=>body?.success?body.data.publicNetwork:null).catch(()=>null);void pending.then(value=>{if(active)setNetwork(value);});return()=>{active=false;};},[]);return network;}
