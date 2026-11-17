'use client';

import { useEffect, useState } from 'react';
import DonorDiscoveryPanel from './DonorDiscoveryPanel';
import { emergencyApi, emergencyFetch } from './EmergencySmsPanel';

export default function EmergencyAccountEntry() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let active = true;
    emergencyFetch<{ enabled: boolean; history: unknown[]; consent: unknown }>(emergencyApi + '?view=account')
      .then(data => { if (active) setVisible(data.enabled || data.history.length > 0 || Boolean(data.consent)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return visible ? <DonorDiscoveryPanel accountEntry /> : null;
}
