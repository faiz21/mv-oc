'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dagre from 'dagre'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { X, ZoomIn, ZoomOut, ChevronDown, ChevronRight, Filter } from 'lucide-react'
import { TreeNodeDetail, type TreeNodeDetailRecord } from './TreeNodeDetail'
import type { AgentNode, HumanNode, TreeEdge, OrganizationTreeData } from '@/features/organization/tree-data'

type AgentStatusFilter = 'all' | 'active' | 'deprecated' | 'unreachable' | 'scaffolded'

const STATUS_FILTER_OPTIONS: { value: AgentStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'deprecated', label: 'Deprecated' },
  { value: 'unreachable', label: 'Unreachable' },
  { value: 'scaffolded', label: 'Scaffolded' },
]

// ---- Node dimensions ----
const NODE_W = 240
const NODE_H = 96

// ---- Status helpers ----
function statusColor(status: string): string {
  if (status === 'active') return 'var(--status-active)'
  if (status === 'deprecated' || status === 'inactive') return 'var(--status-warn)'
  if (status === 'unreachable') return 'var(--status-failed)'
  return 'var(--on-surface-variant)'
}

// ---- Dagre layout ----
function computeLayout(
  rawNodes: Array<{ id: string }>,
  rawEdges: Array<{ source: string; target: string }>
): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 48, ranksep: 88 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const n of rawNodes) g.setNode(n.id, { width: NODE_W, height: NODE_H })
  for (const e of rawEdges) g.setEdge(e.source, e.target)
  dagre.layout(g)
  const positions = new Map<string, { x: number; y: number }>()
  for (const n of rawNodes) {
    const pos = g.node(n.id)
    positions.set(n.id, { x: pos?.x ?? 0, y: pos?.y ?? 0 })
  }
  return positions
}

// ---- Build React Flow nodes/edges from agent data ----
function buildAgentFlow(
  nodes: AgentNode[],
  edges: TreeEdge[],
  search: string,
  collapsed: Set<string>,
  statusFilter: AgentStatusFilter
): { nodes: Node[]; edges: Edge[] } {
  const sq = search.trim().toLowerCase()

  // Apply status filter before layout
  const filteredNodes = statusFilter === 'all' ? nodes : nodes.filter((n) => n.status === statusFilter)
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
  const filteredEdges = edges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target))

  // Determine which nodes are hidden (collapsed subtrees)
  // Build parent → children map using filtered edges
  const childrenOf = new Map<string, string[]>()
  for (const e of filteredEdges) {
    if (!childrenOf.has(e.source)) childrenOf.set(e.source, [])
    childrenOf.get(e.source)!.push(e.target)
  }

  // Find hidden node ids (children of collapsed nodes, recursively)
  const hidden = new Set<string>()
  function markHidden(parentId: string) {
    for (const childId of childrenOf.get(parentId) ?? []) {
      hidden.add(childId)
      markHidden(childId)
    }
  }
  for (const id of collapsed) markHidden(id)

  const visibleNodes = filteredNodes.filter((n) => !hidden.has(n.id))
  const allowedIds = new Set(visibleNodes.map((n) => n.id))
  const visibleEdges = filteredEdges.filter((e) => allowedIds.has(e.source) && allowedIds.has(e.target))

  const positions = computeLayout(visibleNodes, visibleEdges)

  const matchIds = sq
    ? new Set(visibleNodes.filter((n) => `${n.label} ${n.status} ${n.ownerName ?? ''}`.toLowerCase().includes(sq)).map((n) => n.id))
    : null

  const flowNodes: Node[] = visibleNodes.map((n) => {
    const pos = positions.get(n.id) ?? { x: 0, y: 0 }
    const isMatch = matchIds ? matchIds.has(n.id) : true
    const hasChildren = (childrenOf.get(n.id) ?? []).length > 0

    return {
      id: n.id,
      position: pos,
      data: { agentNode: n, collapsed: collapsed.has(n.id), hasChildren },
      type: 'agentCard',
      style: {
        width: NODE_W,
        opacity: matchIds && !isMatch ? 0.35 : 1,
        outline: matchIds && isMatch ? `2px solid var(--mv-light-blue)` : undefined,
        borderRadius: 12,
      },
    }
  })

  const flowEdges: Edge[] = visibleEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    style: { stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 },
    type: 'smoothstep',
  }))

  return { nodes: flowNodes, edges: flowEdges }
}

// ---- Build React Flow nodes/edges from human data ----
function buildHumanFlow(
  nodes: HumanNode[],
  edges: TreeEdge[],
  search: string
): { nodes: Node[]; edges: Edge[] } {
  const sq = search.trim().toLowerCase()

  const positions = computeLayout(nodes, edges)
  const matchIds = sq
    ? new Set(nodes.filter((n) => `${n.label} ${n.role} ${n.email} ${n.departmentName ?? ''}`.toLowerCase().includes(sq)).map((n) => n.id))
    : null

  const flowNodes: Node[] = nodes.map((n) => {
    const pos = positions.get(n.id) ?? { x: 0, y: 0 }
    const isMatch = matchIds ? matchIds.has(n.id) : true
    return {
      id: n.id,
      position: pos,
      data: { humanNode: n },
      type: 'humanCard',
      style: {
        width: NODE_W,
        opacity: matchIds && !isMatch ? 0.35 : 1,
        outline: matchIds && isMatch ? `2px solid var(--primary)` : undefined,
        borderRadius: 12,
      },
    }
  })

  const flowEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    style: { stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 },
    type: 'smoothstep',
  }))

  return { nodes: flowNodes, edges: flowEdges }
}

// ---- Agent card node ----
function AgentCardNode({ data }: { data: { agentNode: AgentNode; collapsed: boolean; hasChildren: boolean } }) {
  const { agentNode: n, collapsed, hasChildren } = data
  return (
    <div
      className="flex flex-col gap-1 rounded-[12px] border px-3 py-3"
      style={{
        width: NODE_W,
        height: NODE_H,
        background: 'rgba(58,126,200,0.08)',
        borderColor: 'var(--border-default)',
        color: 'var(--on-surface)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
          style={{ background: statusColor(n.status) }}
          aria-label={n.status}
        />
        <span className="truncate text-[13px] font-semibold">{n.label}</span>
        {hasChildren && (
          <span className="ml-auto flex-shrink-0 text-[var(--on-surface-variant)]">
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </div>
      <div className="text-[11px] capitalize" style={{ color: 'var(--on-surface-variant)' }}>
        {n.status}
      </div>
      {n.ownerName && (
        <div className="truncate text-[11px]" style={{ color: 'var(--secondary)' }}>
          Owned by {n.ownerName}
        </div>
      )}
      {!n.ownerName && (
        <div className="text-[11px]" style={{ color: 'var(--status-failed)' }}>
          No owner
        </div>
      )}
    </div>
  )
}

// ---- Human card node ----
function HumanCardNode({ data }: { data: { humanNode: HumanNode } }) {
  const { humanNode: n } = data
  return (
    <div
      className="flex flex-col gap-1 rounded-[12px] border px-3 py-3"
      style={{
        width: NODE_W,
        height: NODE_H,
        background: 'var(--surface-container)',
        borderColor: 'var(--border-default)',
        color: 'var(--on-surface)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="truncate text-[13px] font-semibold">{n.label}</span>
        <span
          className="ml-auto flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
          style={{ background: 'rgba(255,193,116,0.12)', color: 'var(--primary)' }}
        >
          {n.role}
        </span>
      </div>
      {n.departmentName && (
        <div className="truncate text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
          {n.departmentName}
        </div>
      )}
      <div className="truncate text-[11px]" style={{ color: 'var(--secondary)' }}>
        {n.email}
      </div>
    </div>
  )
}

const nodeTypes = {
  agentCard: AgentCardNode,
  humanCard: HumanCardNode,
}

// ---- Mobile card list ----
function MobileAgentList({ nodes, onSelect }: { nodes: AgentNode[]; onSelect: (n: AgentNode) => void }) {
  if (nodes.length === 0) {
    return <EmptyState message="No agents to display." />
  }
  return (
    <div className="space-y-2">
      {nodes.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => onSelect(n)}
          className="w-full rounded-[16px] border px-4 py-3 text-left"
          style={{ borderColor: 'var(--border-default)', background: 'rgba(58,126,200,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ background: statusColor(n.status) }} />
            <span className="truncate text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{n.label}</span>
            <span className="ml-auto text-[10px] capitalize" style={{ color: 'var(--on-surface-variant)' }}>{n.status}</span>
          </div>
          {n.ownerName && (
            <div className="mt-1 text-[11px]" style={{ color: 'var(--secondary)' }}>Owned by {n.ownerName}</div>
          )}
        </button>
      ))}
    </div>
  )
}

function MobileHumanList({ nodes, onSelect }: { nodes: HumanNode[]; onSelect: (n: HumanNode) => void }) {
  if (nodes.length === 0) {
    return <EmptyState message="No people to display." />
  }
  return (
    <div className="space-y-2">
      {nodes.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => onSelect(n)}
          className="w-full rounded-[16px] border px-4 py-3 text-left"
          style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}
        >
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{n.label}</span>
            <span
              className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
              style={{ background: 'rgba(255,193,116,0.12)', color: 'var(--primary)' }}
            >
              {n.role}
            </span>
          </div>
          {n.departmentName && (
            <div className="mt-1 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>{n.departmentName}</div>
          )}
        </button>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border py-20 text-center" style={{ borderColor: 'var(--border-default)' }}>
      <div className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>{message}</div>
    </div>
  )
}

// ---- Inner canvas (needs ReactFlowProvider) ----
function CanvasInner({
  activeTree,
  agentNodes,
  agentEdges,
  humanNodes,
  humanEdges,
  search,
  collapsed,
  statusFilter,
  onNodeClick,
  onCollapseToggle,
}: {
  activeTree: 'agent' | 'internal'
  agentNodes: AgentNode[]
  agentEdges: TreeEdge[]
  humanNodes: HumanNode[]
  humanEdges: TreeEdge[]
  search: string
  collapsed: Set<string>
  statusFilter: AgentStatusFilter
  onNodeClick: (record: TreeNodeDetailRecord) => void
  onCollapseToggle: (id: string) => void
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const prevTree = useRef(activeTree)

  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    if (activeTree === 'agent') {
      return buildAgentFlow(agentNodes, agentEdges, search, collapsed, statusFilter)
    }
    return buildHumanFlow(humanNodes, humanEdges, search)
  }, [activeTree, agentNodes, agentEdges, humanNodes, humanEdges, search, collapsed, statusFilter])

  // Fit view when tree or search changes
  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.12, duration: 300 }), 80)
    return () => clearTimeout(timer)
  }, [activeTree, search, collapsed, statusFilter, fitView])

  useEffect(() => {
    if (prevTree.current !== activeTree) {
      prevTree.current = activeTree
    }
  }, [activeTree])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (activeTree === 'agent') {
        const agentNode = node.data.agentNode as AgentNode | undefined
        if (agentNode) {
          if (node.data.hasChildren) {
            onCollapseToggle(node.id)
          }
          onNodeClick({
            kind: 'agent',
            id: agentNode.id,
            label: agentNode.label,
            status: agentNode.status,
            description: agentNode.description,
            endpoint: agentNode.endpoint,
            capabilities: agentNode.capabilities ?? [],
            ownerName: agentNode.ownerName,
          })
        }
      } else {
        const humanNode = node.data.humanNode as HumanNode | undefined
        if (humanNode) {
          onNodeClick({
            kind: 'human',
            id: humanNode.id,
            label: humanNode.label,
            role: humanNode.role,
            email: humanNode.email,
            departmentName: humanNode.departmentName,
            managerName: humanNode.managerName,
          })
        }
      }
    },
    [activeTree, onNodeClick, onCollapseToggle]
  )

  if (flowNodes.length === 0) {
    return (
      <EmptyState
        message={
          activeTree === 'agent'
            ? 'No agents registered yet. Add agents in the Admin panel.'
            : 'No people found. Invite team members to get started.'
        }
      />
    )
  }

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
      >
        <Background color="rgba(255,255,255,0.04)" gap={24} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'agentCard') return 'rgba(58,126,200,0.4)'
            return 'rgba(255,193,116,0.3)'
          }}
          maskColor="rgba(17,19,23,0.7)"
        />
      </ReactFlow>

      {/* Zoom buttons overlay */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => zoomIn()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
          style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)', border: '1px solid var(--border-default)' }}
          aria-label="Zoom in"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          onClick={() => zoomOut()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
          style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)', border: '1px solid var(--border-default)' }}
          aria-label="Zoom out"
        >
          <ZoomOut size={14} />
        </button>
      </div>
    </div>
  )
}

// ---- Main exported component ----
export function OrganizationTreeCanvas({ initialData }: { initialData: OrganizationTreeData }) {
  const [activeTree, setActiveTree] = useState<'agent' | 'internal'>('agent')
  const [search, setSearch] = useState('')
  const [selectedNode, setSelectedNode] = useState<TreeNodeDetailRecord | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)
  const [statusFilter, setStatusFilter] = useState<AgentStatusFilter>('all')

  const agentNodes = initialData.agentTree.nodes
  const agentEdges = initialData.agentTree.edges
  const humanNodes = initialData.internalTree.nodes
  const humanEdges = initialData.internalTree.edges

  // Detect mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleExpandAll = useCallback(() => setCollapsed(new Set()), [])

  const handleCollapseAll = useCallback(() => {
    // Collapse all nodes that have children
    const childSet = new Set(agentEdges.map((e) => e.target))
    const parentIds = agentNodes.filter((n) => !childSet.has(n.id) || agentEdges.some((e) => e.source === n.id)).map((n) => n.id)
    setCollapsed(new Set(parentIds))
  }, [agentNodes, agentEdges])

  const handleCollapseToggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <>
      <div className="rounded-[28px] border px-5 py-5" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab switcher */}
          <div className="flex gap-1 rounded-full p-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <button
              type="button"
              onClick={() => setActiveTree('agent')}
              className="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
              style={activeTree === 'agent' ? activeTabStyle : inactiveTabStyle}
            >
              Agent Org
            </button>
            <button
              type="button"
              onClick={() => setActiveTree('internal')}
              className="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
              style={activeTree === 'internal' ? activeTabStyle : inactiveTabStyle}
            >
              Internal
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: 160, maxWidth: 280 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes…"
              className="w-full rounded-[14px] border px-4 py-1.5 pr-8 text-sm"
              style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.03)', color: 'var(--on-surface)' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--on-surface-variant)' }}
                aria-label="Clear search"
              >
                <X size={10} />
              </button>
            )}
          </div>

          {/* Status filter + Expand / Collapse (agent only) */}
          {activeTree === 'agent' && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* Status filter dropdown */}
              <div className="relative flex items-center gap-1.5 rounded-[12px] border px-2.5 py-1.5"
                style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.03)' }}
              >
                <Filter size={12} style={{ color: 'var(--on-surface-variant)', flexShrink: 0 }} aria-hidden="true" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as AgentStatusFilter)}
                  className="appearance-none bg-transparent text-xs font-medium pr-4 focus:outline-none cursor-pointer"
                  style={{ color: statusFilter === 'all' ? 'var(--on-surface-variant)' : 'var(--on-surface)' }}
                  aria-label="Filter by status"
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={10} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--on-surface-variant)' }} />
              </div>

              <button
                type="button"
                onClick={handleExpandAll}
                className="rounded-[10px] px-3 py-1.5 text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="rounded-[10px] px-3 py-1.5 text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* Canvas / Mobile list */}
        <div className="mt-5">
          {/* Desktop canvas */}
          {!isMobile && (
            <div className="hidden h-[680px] overflow-hidden rounded-[20px] border md:block" style={{ borderColor: 'var(--border-default)' }}>
              <ReactFlowProvider>
                <CanvasInner
                  activeTree={activeTree}
                  agentNodes={agentNodes}
                  agentEdges={agentEdges}
                  humanNodes={humanNodes}
                  humanEdges={humanEdges}
                  search={search}
                  collapsed={collapsed}
                  statusFilter={statusFilter}
                  onNodeClick={setSelectedNode}
                  onCollapseToggle={handleCollapseToggle}
                />
              </ReactFlowProvider>
            </div>
          )}

          {/* Fallback canvas for SSR/no-JS detection */}
          {!isMobile && (
            <div className="md:hidden h-[680px] overflow-hidden rounded-[20px] border" style={{ borderColor: 'var(--border-default)' }}>
              {activeTree === 'agent' ? (
                <MobileAgentList
                  nodes={statusFilter === 'all' ? agentNodes : agentNodes.filter((n) => n.status === statusFilter)}
                  onSelect={(n) => setSelectedNode({ kind: 'agent', id: n.id, label: n.label, status: n.status, description: n.description, endpoint: n.endpoint, capabilities: n.capabilities ?? [], ownerName: n.ownerName })}
                />
              ) : (
                <MobileHumanList nodes={humanNodes} onSelect={(n) => setSelectedNode({ kind: 'human', id: n.id, label: n.label, role: n.role, email: n.email, departmentName: n.departmentName, managerName: n.managerName })} />
              )}
            </div>
          )}

          {/* Mobile list view */}
          {isMobile && (
            <div>
              {activeTree === 'agent' ? (
                <MobileAgentList
                  nodes={statusFilter === 'all' ? agentNodes : agentNodes.filter((n) => n.status === statusFilter)}
                  onSelect={(n) =>
                    setSelectedNode({
                      kind: 'agent',
                      id: n.id,
                      label: n.label,
                      status: n.status,
                      description: n.description,
                      endpoint: n.endpoint,
                      capabilities: n.capabilities ?? [],
                      ownerName: n.ownerName,
                    })
                  }
                />
              ) : (
                <MobileHumanList
                  nodes={humanNodes}
                  onSelect={(n) =>
                    setSelectedNode({
                      kind: 'human',
                      id: n.id,
                      label: n.label,
                      role: n.role,
                      email: n.email,
                      departmentName: n.departmentName,
                      managerName: n.managerName,
                    })
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel — fixed slide-in from right */}
      {selectedNode && (
        <div className="fixed inset-0 z-40" onClick={(e) => { if (e.target === e.currentTarget) setSelectedNode(null) }}>
          <TreeNodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      )}
    </>
  )
}

const activeTabStyle: React.CSSProperties = {
  background: 'var(--primary)',
  color: 'var(--on-primary-container)',
}
const inactiveTabStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--on-surface-variant)',
}
