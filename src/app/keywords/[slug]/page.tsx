import { notFound, permanentRedirect } from 'next/navigation';
import { getKeywordLandingBySlug } from '@/src/lib/keywordLandings';
import { keywordDestination } from '@/src/lib/keywordDestination';
import { getDonorLocations } from '@/src/backend/services/donorLocations';
export const dynamic='force-dynamic';
// Preserve old links while consolidating repetitive keyword variations into useful pages.
export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const entry=getKeywordLandingBySlug((await params).slug);if(!entry)notFound();
  let locations:Awaited<ReturnType<typeof getDonorLocations>>=[];
  try{locations=await getDonorLocations();}catch{/* Curated guides remain a useful destination during a database outage. */}
  permanentRedirect(keywordDestination(entry.keyword,locations));
}
