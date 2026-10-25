import type {Metadata} from 'next';
import MedicalServicePage from '@/src/components/PublicServiceContent';
import {SERVICE_PAGES} from '@/src/lib/publicServices';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:SERVICE_PAGES['prescriptions'].title,description:SERVICE_PAGES['prescriptions'].intro,alternates:{canonical:'/prescriptions'}};
export default function Page(){return <MedicalServicePage page="prescriptions"/>;}
