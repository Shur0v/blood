"use client";
import React,{useState} from 'react';
import {Share2,Check} from 'lucide-react';
export default function PublicPageShare({title}:{title:string}){
 const [copied,setCopied]=useState(false),[error,setError]=useState('');
 return <div><button type="button" className="donor-public-share" onClick={async()=>{try{setError('');const url=new URL(location.pathname,location.origin).href;if(navigator.share)await navigator.share({title,url});else{await navigator.clipboard.writeText(url);setCopied(true);}}catch(error){if(!(error instanceof Error&&error.name==='AbortError'))setError('Use your browser’s address bar to copy this page link.');}}}>{copied?<Check size={16}/>:<Share2 size={16}/>} {copied?'Link copied':'Share this page'}</button>{error&&<p role="status">{error}</p>}</div>;
}
