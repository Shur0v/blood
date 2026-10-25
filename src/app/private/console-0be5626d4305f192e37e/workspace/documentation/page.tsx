import PlatformGuide from '@/src/components/PlatformGuide';
import {requireStaffPage} from '@/src/backend/utils/staffPage';
export const dynamic='force-dynamic';
export default async function Documentation(){await requireStaffPage('ADMIN','/private/console-0be5626d4305f192e37e/login');return <PlatformGuide/>;}
