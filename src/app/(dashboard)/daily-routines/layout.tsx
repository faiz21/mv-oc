import { requireAuthUser } from '@/lib/data/auth'
import { DailyRoutinesNav } from '@/components/daily-routines/DailyRoutinesNav'

export default async function DailyRoutinesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authUser = await requireAuthUser()

  return (
    <div className="flex min-h-screen">
      <DailyRoutinesNav userRole={authUser.role} />
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  )
}
