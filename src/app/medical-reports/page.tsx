import type {Metadata} from 'next';
import MedicalServicePage from '@/src/components/PublicServiceContent';
import {SERVICE_PAGES} from '@/src/lib/publicServices';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:SERVICE_PAGES['medical-reports'].title,description:SERVICE_PAGES['medical-reports'].intro,alternates:{canonical:'/medical-reports'}};
export default function Page(){return <MedicalServicePage page="medical-reports"/>;}
