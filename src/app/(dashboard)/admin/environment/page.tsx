import { checkAllSecrets } from '@/lib/admin/secret-mask'
import { EnvironmentPanel } from '@/components/admin/EnvironmentPanel'

export default function AdminEnvironmentPage() {
  const checks = checkAllSecrets()

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>
          Environment & Secrets
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          Verify required variables are present without revealing values.
        </p>
      </div>
      <EnvironmentPanel initialChecks={checks} />
    </div>
  )
}
