import { getPublicBaseUrl } from '@/src/backend/config/env';
export async function GET(){return Response.redirect(getPublicBaseUrl()+'/sitemap-guides.xml',308);}
