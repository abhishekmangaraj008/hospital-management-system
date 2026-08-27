import React from 'react'

const LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
}

export default function StatusBadge({ status }) {
  const cls = `badge badge-${status?.toLowerCase()}`
  return <span className={cls}>{LABELS[status] || status}</span>
}
