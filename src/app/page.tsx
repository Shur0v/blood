import { HomeExperience } from "@/src/components/HomeExperience";
import DonorLocationDirectory from '@/src/components/DonorLocationDirectory';

// The modal directory must reflect current database entries, not a build-time snapshot.
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <HomeExperience locationDirectory={<DonorLocationDirectory limit={24}/>}/>;
}
