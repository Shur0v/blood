import {HomePageExperience as HomeExperience} from '@/src/components/HomePageExperience';
import DonorLocationDirectory from '@/src/components/DonorLocationDirectory';

import {getHomepageContent} from '@/src/backend/services/homepageContent';

// The modal directory must reflect current database entries, not a build-time snapshot.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return <HomeExperience homepageContent={await getHomepageContent()} locationDirectory={<DonorLocationDirectory limit={24}/>}/>;
}
