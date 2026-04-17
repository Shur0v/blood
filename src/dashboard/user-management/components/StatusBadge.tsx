import React from 'react';

type StatusType = 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Resolved' | 'Inactive';

interface StatusBadgeProps {
  status: StatusType | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let colorStyles = '';

  switch (status.toLowerCase()) {
    case 'approved':
    case 'active':
    case 'resolved':
      colorStyles = 'bg-green-500/10 text-green-600 border-green-500/20';
      break;
    case 'pending':
      colorStyles = 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      break;
    case 'rejected':
    case 'inactive':
      colorStyles = 'bg-red-500/10 text-red-600 border-red-500/20';
      break;
    default:
      colorStyles = 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colorStyles}`}>
      {status}
    </span>
  );
}
