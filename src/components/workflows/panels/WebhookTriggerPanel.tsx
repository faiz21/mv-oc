'use client'

import { useState } from 'react'
import { Copy, Play } from 'lucide-react'
import { PanelField } from '@/components/workflows/panels/PanelContainer'
import type { WebhookAuthMethod, WorkflowNodeData } from '@/features/workflows/editor-model'

interface WebhookTriggerPanelProps {
  data: WorkflowNodeData
  onChange: (patch: Partial<WorkflowNodeData>) => void
}

export function WebhookTriggerPanel({ data, onChange }: WebhookTriggerPanelProps) {
  const [copied, setCopied] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const webhookUrl = data.webhookUrl || '(URL generated after first save)'

  function copyUrl() {
    if (data.webhookUrl) {
      void navigator.clipboard.writeText(data.webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  function testWebhook() {
    // Stub — in production this would POST to the webhook URL
    setTestResult('Test webhook sent (mock). Check sandbox results for response.')
    setTimeout(() => setTestResult(null), 4000)
  }

  return (
    <>
      <PanelField label="Webhook URL">
        <div className="flex items-center gap-2">
          <div
            className="flex-1 truncate rounded-[18px] px-4 py-3 text-[12px] font-mono"
            style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
          >
            {webhookUrl}
          </div>
          {data.webhookUrl && (
            <button
              onClick={copyUrl}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/5"
              style={{ color: copied ? 'var(--status-active)' : 'var(--on-surface-variant)' }}
              aria-label="Copy webhook URL"
            >
              <Copy size={14} />
            </button>
          )}
        </div>
      </PanelField>

      <PanelField label="Payload schema (JSON)" hint="Define the expected payload structure for incoming webhooks.">
        <textarea
          value={data.payloadSchema ?? '{}'}
          onChange={(e) => onChange({ payloadSchema: e.target.value })}
          placeholder='{ "type": "object", "properties": { ... } }'
          className="min-h-[100px] w-full rounded-[18px] px-4 py-3 font-mono text-[12px] outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </PanelField>

      <PanelField label="Authentication method">
        <select
          value={data.authMethod ?? 'none'}
          onChange={(e) => onChange({ authMethod: e.target.value as WebhookAuthMethod })}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          <option value="none">None</option>
          <option value="api_key">API Key</option>
          <option value="hmac">HMAC Signature</option>
        </select>
      </PanelField>

      {data.authMethod && data.authMethod !== 'none' && (
        <PanelField label="Auth secret" hint="Reference a secret using {secret:NAME} pattern.">
          <input
            value={data.authSecret ?? ''}
            onChange={(e) => onChange({ authSecret: e.target.value })}
            placeholder="{secret:WEBHOOK_API_KEY}"
            className="w-full rounded-[18px] px-4 py-3 font-mono text-[12px] outline-none"
            style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
          />
        </PanelField>
      )}

      {/* Test webhook button */}
      <div className="mt-5">
        <button
          onClick={testWebhook}
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-white/5"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
        >
          <Play size={14} />
          Test webhook
        </button>
        {testResult && (
          <div className="mt-3 text-[12px]" style={{ color: 'var(--status-active)' }}>
            {testResult}
          </div>
        )}
      </div>
    </>
  )
}
