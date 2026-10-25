import type {Metadata} from 'next';
import MedicalServicePage from '@/src/components/PublicServiceContent';
import {SERVICE_PAGES} from '@/src/lib/publicServices';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:SERVICE_PAGES['medical-profile'].title,description:SERVICE_PAGES['medical-profile'].intro,alternates:{canonical:'/medical-profile'}};
export default function Page(){return <MedicalServicePage page="medical-profile"/>;}
