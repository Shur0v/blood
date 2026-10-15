import { HomeExperience } from "@/src/components/HomeExperience";
import DonorLocationDirectory from '@/src/components/DonorLocationDirectory';

export default function HomePage() {
  return <HomeExperience locationDirectory={<DonorLocationDirectory limit={24}/>}/>;
}
