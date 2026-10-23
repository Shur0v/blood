import Shell from '@/src/components/AdminWorkspaceShell';
import { requireStaffPage } from '@/src/backend/utils/staffPage';
export const dynamic='force-dynamic';
export default async function Layout({children}:{children:React.ReactNode}){
 await requireStaffPage('ADMIN','/private/console-0be5626d4305f192e37e/login');
 return <Shell>{children}</Shell>;
}
