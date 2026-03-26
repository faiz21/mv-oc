'use client'

import { LiveSync } from '@/components/layout/LiveSync'

const TABLES = ['approval_queue', 'audit_log']

export function MissionControlLiveSync() {
  return <LiveSync tables={TABLES} channelPrefix="mission-control" />
}
