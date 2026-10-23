import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireActiveAdmin } from './activeAdmin';

export async function requireStaffPage(role: 'ADMIN' | 'MANAGER', loginPath: string) {
  const cookieStore = await cookies();
  try {
    const session = await requireActiveAdmin(new Request('http://localhost/staff-page', {headers:{cookie:cookieStore.toString()}}));
    if (session.role !== 'ADMIN' && session.role !== role) redirect(loginPath);
  } catch {
    redirect(loginPath);
  }
}
