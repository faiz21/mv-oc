import { describe, expect, it } from 'vitest'
import { buildSidebarModel, type SidebarModuleMeta, type SidebarNavItem } from './sidebar-model'

describe('sidebar model', () => {
  const activeModule: SidebarModuleMeta = {
    label: 'Dashboard',
    href: '/dashboard',
    title: 'Dashboard',
    sections: [
      { label: 'Runs', href: '/dashboard' },
      { label: 'System', href: '/dashboard#system-health' },
    ],
    quickActions: [
      { label: 'Open Dashboard', href: '/dashboard' },
      { label: 'Open Hub', href: '/hub' },
    ],
  }

  const navItems: SidebarNavItem[] = [
    { label: 'Hub', href: '/hub' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Mission Control', href: '/mission-control' },
  ]

  it('removes duplicate quick actions that point to the active module context', () => {
    const model = buildSidebarModel({
      activeModule,
      navItems,
      pathname: '/dashboard',
    })

    expect(model.quickActions).toEqual([{ label: 'Open Hub', href: '/hub' }])
  })

  it('keeps switch-module focused on other modules', () => {
    const model = buildSidebarModel({
      activeModule,
      navItems,
      pathname: '/dashboard',
    })

    expect(model.moduleLinks).toEqual([
      { label: 'Hub', href: '/hub' },
      { label: 'Mission Control', href: '/mission-control' },
    ])
  })
})
