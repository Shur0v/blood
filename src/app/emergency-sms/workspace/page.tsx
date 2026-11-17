import type { Metadata } from 'next';
import EmergencyBranchWorkspace from '@/src/components/EmergencyBranchWorkspace';

export const metadata: Metadata = { title: 'BloodNet | হাসপাতাল কর্মক্ষেত্র', robots: { index: false, follow: false } };

export default function Page() {
  return <EmergencyBranchWorkspace />;
}
