'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Table, TableCell, TableRow } from '@/src/admin-dashboard/components/common/Table';

interface RiskItem {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  eventType: string;
  reason: string;
  scoreDelta: number;
  createdAt: string;
}

export default function SpamMonitorPage() {
  const [rows, setRows] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadRows = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/abuse/suspicious-users?page=1&limit=20', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setRows([]);
        return;
      }
      setRows(payload.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, []);

  const restrictUser = async (userId: string | null) => {
    if (!userId) return;
    const res = await fetch(`/api/admin/abuse/restrict/${userId}`, {
      method: 'POST',
      credentials: 'include',
    });
    const payload = await res.json();
    setMessage(payload.message || (payload.success ? 'User restricted.' : 'Failed to restrict user.'));
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Spam & Abuse Monitor</h2>
        <p className="text-sm text-gray-500 mt-1">Realtime suspicious identity events and admin restriction control.</p>
      </div>

      {message && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500">
          {message}
        </div>
      )}

      <Card title="Suspicious Users (Latest 20)">
        <Table headers={['User', 'Event', 'Reason', 'Risk', 'Date', 'Actions']}>
          {!loading &&
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-semibold">{row.userName}</div>
                  <div className="text-xs text-gray-500">{row.userEmail}</div>
                </TableCell>
                <TableCell>{row.eventType}</TableCell>
                <TableCell>{row.reason}</TableCell>
                <TableCell>{row.scoreDelta}</TableCell>
                <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    disabled={!row.userId}
                    onClick={() => void restrictUser(row.userId)}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                  >
                    Restrict User
                  </button>
                </TableCell>
              </TableRow>
            ))}
        </Table>
        {!loading && rows.length === 0 && (
          <p className="py-6 text-sm text-gray-500">No suspicious events found.</p>
        )}
      </Card>
    </div>
  );
}
