import Shell from '@/src/components/ManagerWorkspaceShell';
import { requireStaffPage } from '@/src/backend/utils/staffPage';
export const dynamic='force-dynamic';
export default async function Layout({children}:{children:React.ReactNode}){
 await requireStaffPage('MANAGER','/private/operations-1c0fdec8fcca3f8ad2e6/login');
 return <Shell>{children}</Shell>;
}
