export interface SidebarNavItem {
  label: string
  href: string
}

export interface SidebarModuleMeta {
  label: string
  href: string
  title: string
  sections?: Array<{
    label: string
    href: string
  }>
  quickActions?: Array<{
    label: string
    href: string
  }>
}

export function buildSidebarModel(input: {
  activeModule: SidebarModuleMeta
  navItems: SidebarNavItem[]
  pathname: string
}) {
  const contextLinks = input.activeModule.sections?.length
    ? input.activeModule.sections
    : [{ label: input.activeModule.label, href: input.activeModule.href }]

  const contextHrefs = new Set(contextLinks.map((item) => item.href))

  const quickActions = (input.activeModule.quickActions ?? []).filter(
    (item) => item.href !== input.pathname && !contextHrefs.has(item.href),
  )

  const moduleLinks = input.navItems.filter((item) => !input.pathname.startsWith(item.href))

  return {
    contextLinks,
    quickActions,
    moduleLinks,
  }
}
