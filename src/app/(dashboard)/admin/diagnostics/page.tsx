import { DiagnosticsPanel } from '@/components/admin/DiagnosticsPanel'

export default function AdminDiagnosticsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>
          System Diagnostics
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          Run system checks and verify service health.
        </p>
      </div>
      <DiagnosticsPanel initial={null} />
    </div>
  )
}
