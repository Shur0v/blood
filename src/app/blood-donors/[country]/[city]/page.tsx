import DonorLocationLanding, { donorLocationMetadata, type LocationParams } from '@/src/components/DonorLocationLanding';

export const dynamic = "force-dynamic";

export async function generateMetadata({params}:{params:Promise<LocationParams>}) { return donorLocationMetadata(await params,'blood'); }
export default async function Page({params}:{params:Promise<LocationParams>}) { return <DonorLocationLanding params={await params} mode="blood"/>; }
