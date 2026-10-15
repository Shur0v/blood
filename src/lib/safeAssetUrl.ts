import { z } from 'zod';

export const SafeAssetUrl=z.string().max(2048).refine(value=>{
  if(/^\/uploads\/[a-zA-Z0-9_./-]+$/.test(value)&&!value.includes('..'))return true;
  try {const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}
},'Use a valid HTTP(S) asset URL.');
