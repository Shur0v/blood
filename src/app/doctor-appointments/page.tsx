import type {Metadata} from 'next';
import MedicalServicePage from '@/src/components/PublicServiceContent';
import {SERVICE_PAGES} from '@/src/lib/publicServices';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:SERVICE_PAGES['doctor-appointments'].title,description:SERVICE_PAGES['doctor-appointments'].intro,alternates:{canonical:'/doctor-appointments'}};
export default function Page(){return <MedicalServicePage page="doctor-appointments"/>;}
