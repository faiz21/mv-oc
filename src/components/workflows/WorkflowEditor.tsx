'use client'

import '@xyflow/react/dist/style.css'

import { startTransition, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type EdgeTypes,
  type NodeTypes,
} from '@xyflow/react'
import {
  Bot,
  Clock,
  FileText,
  Flag,
  FlaskConical,
  GitBranch,
  GitMerge,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Webhook,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  createEditorNode,
  defaultNodeData,
  requiresWorkflowApproval,
  slugifyWorkflowKey,
  validateWorkflowDocument,
  type WorkflowEditorDocument,
  type WorkflowEditorEdge,
  type WorkflowEditorNode,
  type WorkflowNodeData,
  type WorkflowNodeType,
  type WorkflowSettings,
  type WorkflowVersionSummary,
} from '@/features/workflows/editor-model'
import { WorkflowCanvasNode } from '@/components/workflows/WorkflowCanvasNode'
import { WorkflowLabeledEdge } from '@/components/workflows/WorkflowLabeledEdge'
import { PanelContainer } from '@/components/workflows/panels/PanelContainer'
import { WorkflowConfigPanel } from '@/components/workflows/WorkflowConfigPanel'
import { VersionHistory } from '@/components/workflows/VersionHistory'
import { SandboxTestModal } from '@/components/workflows/SandboxTestModal'
import { WorkflowAuditTrail } from '@/components/workflows/WorkflowAuditTrail'

const nodeTypes: NodeTypes = {
  start: WorkflowCanvasNode,
  agent_task: WorkflowCanvasNode,
  approval_gate: WorkflowCanvasNode,
  end: WorkflowCanvasNode,
  parallel_branch: WorkflowCanvasNode,
  wait_join: WorkflowCanvasNode,
  webhook_trigger: WorkflowCanvasNode,
}

const edgeTypes: EdgeTypes = {
  labeled: WorkflowLabeledEdge,
}

type SidebarTab = 'palette' | 'settings' | 'versions' | 'audit'

const PALETTE_ITEMS: Array<{ label: string; type: WorkflowNodeType; icon: React.ReactNode }> = [
  { label: 'Start', type: 'start', icon: <Plus size={14} /> },
  { label: 'Agent Task', type: 'agent_task', icon: <Bot size={14} /> },
  { label: 'Approval Gate', type: 'approval_gate', icon: <ShieldCheck size={14} /> },
  { label: 'Parallel Branch', type: 'parallel_branch', icon: <GitBranch size={14} /> },
  { label: 'Wait / Join', type: 'wait_join', icon: <GitMerge size={14} /> },
  { label: 'Webhook Trigger', type: 'webhook_trigger', icon: <Webhook size={14} /> },
  { label: 'End', type: 'end', icon: <Flag size={14} /> },
]

interface WorkflowEditorProps {
  initialDocument: WorkflowEditorDocument
  versions: WorkflowVersionSummary[]
  agents: Array<{ id: string; name: string; status: string }>
  isNew?: boolean
}

function EditorInner({ initialDocument, versions, agents, isNew = false }: WorkflowEditorProps) {
  const router = useRouter()
  const reactFlowInstance = useReactFlow()
  const [settings, setSettings] = useState(initialDocument.settings)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialDocument.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialDocument.edges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [changeSummary, setChangeSummary] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [isPending, startUiTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('palette')
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const undoStack = useRef<Array<{ nodes: WorkflowEditorNode[]; edges: WorkflowEditorEdge[] }>>([])

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null
  const approvalLocked = requiresWorkflowApproval(nodes)

  const document: WorkflowEditorDocument = {
    settings: { ...settings, requiresApproval: approvalLocked ? true : settings.requiresApproval },
    nodes,
    edges,
  }

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [nodes, edges, settings])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputFocused()) {
        setNodes((current) => current.filter((n) => !n.selected))
        setEdges((current) => current.filter((ed) => !ed.selected))
      }

      if (isMeta && e.key === 'd') {
        e.preventDefault()
        setNodes((current) => {
          const selected = current.filter((n) => n.selected)
          const duplicated = selected.map((n) => ({
            ...n,
            id: `${n.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            position: { x: n.position.x + 40, y: n.position.y + 40 },
            selected: false,
            data: { ...n.data, label: `${n.data.label} (copy)` },
          }))
          return [...current.map((n) => ({ ...n, selected: false })), ...duplicated]
        })
      }

      if (isMeta && e.key === 'z') {
        e.preventDefault()
        const last = undoStack.current.pop()
        if (last) {
          setNodes(last.nodes)
          setEdges(last.edges)
        }
      }

      if (isMeta && e.key === 's') {
        e.preventDefault()
        void saveDocument('draft')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Unsaved changes warning on navigation
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      undoStack.current.push({ nodes: [...nodes], edges: [...edges] })
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: `${connection.source}-${connection.target}-${Date.now()}`,
            type: 'labeled',
            data: { conditionType: 'always' },
            animated: false,
          },
          current,
        ),
      )
    },
    [setEdges, nodes, edges],
  )

  function handleSettingChange<K extends keyof WorkflowSettings>(key: K, value: WorkflowSettings[K]) {
    setSettings((current) => {
      const next = { ...current, [key]: value }
      if (key === 'name') {
        next.key = slugifyWorkflowKey(String(value))
      }
      return next
    })
  }

  function handleNodeDataChange(patch: Partial<WorkflowNodeData>) {
    if (!selectedNodeId) return
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNodeId
          ? { ...node, data: { ...node.data, ...patch } }
          : node,
      ),
    )
  }

  function handleDeleteNode(nodeId: string) {
    undoStack.current.push({ nodes: [...nodes], edges: [...edges] })
    setNodes((current) => current.filter((n) => n.id !== nodeId))
    setEdges((current) => current.filter((e) => e.source !== nodeId && e.target !== nodeId))
    if (selectedNodeId === nodeId) setSelectedNodeId(null)
  }

  function addNode(type: WorkflowNodeType) {
    const viewport = reactFlowInstance.getViewport()
    const nextId = `${type}-${Date.now()}`
    const position = {
      x: (-viewport.x + 400) / viewport.zoom,
      y: (-viewport.y + 300) / viewport.zoom,
    }
    const nextNode = createEditorNode(nextId, type, position, defaultNodeData(type))
    undoStack.current.push({ nodes: [...nodes], edges: [...edges] })
    setNodes((current) => [...current, nextNode])
    setSelectedNodeId(nextId)
  }

  async function saveDocument(mode: 'draft' | 'activate') {
    setNotice(null)

    const nextSettings: WorkflowSettings = approvalLocked
      ? { ...settings, requiresApproval: true }
      : settings

    const nextDocument: WorkflowEditorDocument = {
      settings: nextSettings,
      nodes,
      edges,
    }

    const validation = validateWorkflowDocument(nextDocument)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors([])
    setIsSaving(true)

    try {
      const target = nextSettings.workflowId
        ? `/api/workflows/${nextSettings.workflowId}/save`
        : '/api/workflows'

      const response = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: nextDocument,
          changeSummary,
        }),
      })

      const result = await response.json() as Record<string, unknown>
      if (!response.ok) {
        setErrors(Array.isArray(result.errors) ? result.errors as string[] : ['Failed to save workflow.'])
        return
      }

      const workflowId = (nextSettings.workflowId ?? result.workflowId) as string
      const versionId = result.versionId as string

      if (mode === 'activate') {
        const activateResponse = await fetch(`/api/workflows/${workflowId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'active',
            versionId,
          }),
        })

        const activateResult = await activateResponse.json() as Record<string, unknown>
        if (!activateResponse.ok) {
          setErrors(Array.isArray(activateResult.errors) ? activateResult.errors as string[] : ['Failed to activate workflow.'])
          return
        }

        setSettings((current) => ({
          ...current,
          workflowId,
          activeVersionId: versionId,
          status: 'active',
          requiresApproval: approvalLocked ? true : current.requiresApproval,
        }))
        setNotice('Workflow activated on the latest saved version.')
      } else {
        setSettings((current) => ({
          ...current,
          workflowId,
          activeVersionId: current.status === 'active' ? current.activeVersionId : versionId,
          requiresApproval: approvalLocked ? true : current.requiresApproval,
        }))
        setNotice('Workflow version saved.')
      }

      setChangeSummary('')
      setHasUnsavedChanges(false)

      startTransition(() => {
        if (isNew || workflowId !== nextSettings.workflowId) {
          router.replace(`/workflow-builder/${workflowId}`)
        } else {
          router.refresh()
        }
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function deactivateWorkflow() {
    if (!settings.workflowId) return

    setIsSaving(true)
    setErrors([])
    setNotice(null)

    try {
      const response = await fetch(`/api/workflows/${settings.workflowId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' }),
      })
      const result = await response.json() as Record<string, unknown>
      if (!response.ok) {
        setErrors(Array.isArray(result.errors) ? result.errors as string[] : ['Failed to deactivate workflow.'])
        return
      }

      setSettings((current) => ({ ...current, status: 'inactive' }))
      setNotice('Workflow moved to inactive.')
      startUiTransition(() => router.refresh())
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdgeClick(_: React.MouseEvent, edge: WorkflowEditorEdge) {
    undoStack.current.push({ nodes: [...nodes], edges: [...edges] })
    setEdges((current) => current.filter((e) => e.id !== edge.id))
  }

  return (
    <div className="flex min-h-[calc(100vh-52px)] flex-col">
      {/* Top header */}
      <div className="flex flex-wrap items-start justify-between gap-6 px-8 py-8">
        <div className="max-w-[680px]">
          <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>
            Workflow Builder
          </div>
          <h1 className="mt-3 flex items-center gap-3 font-display text-[44px] font-semibold tracking-[-0.05em]" style={{ color: 'var(--on-surface)' }}>
            {settings.name}
            {hasUnsavedChanges && (
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--tertiary)' }} title="Unsaved changes" />
            )}
          </h1>
          <p className="mt-3 max-w-[640px] text-[15px] leading-7" style={{ color: 'var(--secondary)' }}>
            Canvas-first authoring for the operational graph. Save versions, enforce approval rules, and activate the version you trust.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void saveDocument('draft')}
            disabled={isSaving || isPending}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            style={{ background: 'var(--surface-container-highest)', color: 'var(--on-surface)' }}
          >
            <Save size={16} />
            Save Version
          </button>
          {settings.workflowId && (
            <button
              type="button"
              onClick={() => setSandboxOpen(true)}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
            >
              <FlaskConical size={16} />
              Sandbox Test
            </button>
          )}
          <button
            type="button"
            onClick={() => void saveDocument('activate')}
            disabled={isSaving || isPending}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
              color: 'var(--on-primary-container)',
            }}
          >
            <Sparkles size={16} />
            Save & Activate
          </button>
          {settings.workflowId && settings.status === 'active' && (
            <button
              type="button"
              onClick={() => void deactivateWorkflow()}
              disabled={isSaving || isPending}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--secondary)' }}
            >
              Deactivate
            </button>
          )}
        </div>
      </div>

      {/* Main layout: sidebar + canvas + property panel */}
      <div className="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)] gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {/* Left sidebar */}
        <aside className="min-h-0 overflow-auto px-5 py-6" style={{ background: 'var(--surface-container-low)' }}>
          {/* Tab bar */}
          <div className="mb-5 flex gap-1">
            {([
              { key: 'palette', label: 'Build', icon: <Plus size={12} /> },
              { key: 'settings', label: 'Config', icon: <Bot size={12} /> },
              { key: 'versions', label: 'History', icon: <Clock size={12} /> },
              { key: 'audit', label: 'Audit', icon: <FileText size={12} /> },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSidebarTab(tab.key)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors"
                style={{
                  background: sidebarTab === tab.key ? 'var(--primary)' : 'transparent',
                  color: sidebarTab === tab.key ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Palette tab */}
          {sidebarTab === 'palette' && (
            <>
              <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
                Build palette
              </div>
              <div className="mt-4 grid gap-3">
                {PALETTE_ITEMS.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addNode(item.type)}
                    className="flex items-center justify-between rounded-[22px] px-4 py-3 text-left transition-colors hover:bg-white/5"
                    style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--on-surface)' }}
                  >
                    <span>{item.label}</span>
                    {item.icon}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
                  Change summary
                </div>
                <textarea
                  value={changeSummary}
                  onChange={(event) => setChangeSummary(event.target.value)}
                  placeholder="What changed in this version?"
                  className="mt-3 min-h-[120px] w-full rounded-[22px] px-4 py-4 text-sm outline-none"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
                />
              </div>
            </>
          )}

          {/* Settings tab */}
          {sidebarTab === 'settings' && (
            <WorkflowConfigPanel
              settings={settings}
              nodes={nodes}
              agents={agents}
              onChange={handleSettingChange}
            />
          )}

          {/* Versions tab */}
          {sidebarTab === 'versions' && (
            <VersionHistory
              workflowId={settings.workflowId ?? ''}
              versions={versions}
              currentVersionId={settings.activeVersionId ?? null}
              onRestore={() => router.refresh()}
            />
          )}

          {/* Audit tab */}
          {sidebarTab === 'audit' && settings.workflowId && (
            <WorkflowAuditTrail workflowId={settings.workflowId} />
          )}

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="mt-8 rounded-[22px] px-4 py-4" style={{ background: 'rgba(248,113,113,0.14)', color: 'var(--status-failed, #ef4444)' }}>
              <div className="text-[11px] uppercase tracking-[0.2em]">Validation</div>
              <ul className="mt-3 space-y-2 text-sm">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {notice && (
            <div className="mt-8 rounded-[22px] px-4 py-4 text-sm" style={{ background: 'rgba(110,231,183,0.14)', color: 'var(--status-active)' }}>
              {notice}
            </div>
          )}
        </aside>

        {/* Canvas */}
        <section id="canvas" className="min-h-0" style={{ background: 'var(--background)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onEdgeClick={handleEdgeClick}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: 'labeled' }}
            proOptions={{ hideAttribution: true }}
            style={{
              backgroundColor: 'var(--background)',
              backgroundImage: 'radial-gradient(circle, rgba(58,61,66,0.65) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            <Background gap={20} size={1} color="rgba(58,61,66,0.25)" />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => {
                const colors: Record<string, string> = {
                  start: 'var(--status-active)',
                  agent_task: 'var(--primary)',
                  approval_gate: 'var(--tertiary)',
                  end: 'var(--secondary)',
                  parallel_branch: '#8b5cf6',
                  wait_join: '#6366f1',
                  webhook_trigger: '#f59e0b',
                }
                return colors[node.type ?? ''] ?? 'var(--primary)'
              }}
              style={{ background: 'var(--surface-container-low)' }}
            />
            <Controls />
          </ReactFlow>
        </section>
      </div>

      {/* Property inspector panel (slides in from right) */}
      <PanelContainer
        node={selectedNode}
        agents={agents}
        approvalLocked={approvalLocked}
        onClose={() => setSelectedNodeId(null)}
        onDataChange={handleNodeDataChange}
        onDeleteNode={handleDeleteNode}
      />

      {/* Sandbox Test Modal */}
      {settings.workflowId && (
        <SandboxTestModal
          workflowId={settings.workflowId}
          open={sandboxOpen}
          onClose={() => setSandboxOpen(false)}
        />
      )}
    </div>
  )
}

export function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  )
}

function isInputFocused(): boolean {
  const active = globalThis.document?.activeElement
  if (!active) return false
  const tag = active.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || (active as HTMLElement).isContentEditable
}
