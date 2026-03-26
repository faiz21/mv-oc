'use client'

import '@xyflow/react/dist/style.css'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  ArrowLeft,
  Bot,
  Flag,
  GitBranch,
  GitMerge,
  Loader2,
  Play,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Webhook,
} from 'lucide-react'
import Link from 'next/link'
import { WorkflowCanvasNode } from '@/components/workflows/WorkflowCanvasNode'
import { WorkflowLabeledEdge } from '@/components/workflows/WorkflowLabeledEdge'
import {
  createEditorEdge,
  createEditorNode,
  defaultNodeData,
  type WorkflowEditorDocument,
  type WorkflowEditorNode,
  type WorkflowNodeType,
  type WorkflowVersionSummary,
} from '@/features/workflows/editor-model'

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

const PALETTE_ITEMS: Array<{ label: string; type: WorkflowNodeType; icon: React.ReactNode }> = [
  { label: 'Start', type: 'start', icon: <Play size={14} /> },
  { label: 'Agent Task', type: 'agent_task', icon: <Bot size={14} /> },
  { label: 'Approval Gate', type: 'approval_gate', icon: <ShieldCheck size={14} /> },
  { label: 'Parallel Branch', type: 'parallel_branch', icon: <GitBranch size={14} /> },
  { label: 'Wait / Join', type: 'wait_join', icon: <GitMerge size={14} /> },
  { label: 'Webhook Trigger', type: 'webhook_trigger', icon: <Webhook size={14} /> },
  { label: 'End', type: 'end', icon: <Flag size={14} /> },
]

interface WorkflowCanvasProps {
  document: WorkflowEditorDocument
  versions: WorkflowVersionSummary[]
  agents: Array<{ id: string; name: string; status: string }>
  onSave?: (nodes: WorkflowEditorNode[], edges: WorkflowEditorDocument['edges']) => void
  onNodeSelect?: (nodeId: string | null) => void
  isDirty?: boolean
}

function CanvasInner({ document: doc, versions, agents, onSave, onNodeSelect, isDirty }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(doc.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(doc.edges)
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(isDirty ?? false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const reactFlowInstance = useReactFlow()
  const undoStack = useRef<Array<{ nodes: typeof nodes; edges: typeof edges }>>([])

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [nodes, edges])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected nodes/edges
        setNodes((current) => current.filter((n) => !n.selected))
        setEdges((current) => current.filter((ed) => !ed.selected))
      }

      if (isMeta && e.key === 'd') {
        e.preventDefault()
        // Duplicate selected nodes
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
        // Undo
        const last = undoStack.current.pop()
        if (last) {
          setNodes(last.nodes)
          setEdges(last.edges)
        }
      }

      if (isMeta && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      // Save undo state
      undoStack.current.push({ nodes: [...nodes], edges: [...edges] })
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: `${connection.source}-${connection.target}-${Date.now()}`,
            type: 'labeled',
            data: { conditionType: 'always' },
            animated: false,
          },
          eds,
        ),
      )
    },
    [setEdges, nodes, edges],
  )

  function handleNodeClick(_: React.MouseEvent, node: WorkflowEditorNode) {
    onNodeSelect?.(node.id)
  }

  function addNodeFromPalette(type: WorkflowNodeType) {
    const viewport = reactFlowInstance.getViewport()
    const nextId = `${type}-${Date.now()}`
    const position = {
      x: (-viewport.x + 400) / viewport.zoom,
      y: (-viewport.y + 300) / viewport.zoom,
    }
    const newNode = createEditorNode(nextId, type, position, defaultNodeData(type))
    undoStack.current.push({ nodes: [...nodes], edges: [...edges] })
    setNodes((current) => [...current, newNode])
    onNodeSelect?.(nextId)
    setPaletteOpen(false)
  }

  async function handleSave() {
    if (!doc.settings.workflowId) return
    setIsSaving(true)
    setNotice(null)
    try {
      if (onSave) {
        onSave(nodes, edges)
      } else {
        const payload: WorkflowEditorDocument = {
          settings: doc.settings,
          nodes,
          edges,
        }
        const res = await fetch(`/api/workflows/${doc.settings.workflowId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document: payload }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as Record<string, unknown>
          setNotice(typeof body.errors === 'string' ? body.errors : 'Save failed')
        } else {
          setNotice('Saved')
          setHasUnsavedChanges(false)
          setTimeout(() => setNotice(null), 2000)
        }
      }
    } catch {
      setNotice('Network error')
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdgeClick(_: React.MouseEvent, edge: typeof edges[number]) {
    setEdges((current) => current.filter((e) => e.id !== edge.id))
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-4 border-b px-5 py-3"
        style={{
          background: 'var(--surface-container)',
          borderColor: 'var(--outline-variant)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/workflow-builder"
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] transition-colors hover:opacity-80"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <ArrowLeft size={14} />
            Library
          </Link>
          <span className="text-[15px] font-semibold" style={{ color: 'var(--on-surface)' }}>
            {doc.settings.name}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
            style={{
              background:
                doc.settings.status === 'active'
                  ? 'rgba(56,199,135,0.12)'
                  : doc.settings.status === 'draft'
                    ? 'rgba(255,193,7,0.12)'
                    : 'rgba(255,255,255,0.06)',
              color:
                doc.settings.status === 'active'
                  ? 'var(--status-active)'
                  : doc.settings.status === 'draft'
                    ? 'var(--tertiary)'
                    : 'var(--on-surface-variant)',
            }}
          >
            {doc.settings.status}
          </span>
          {versions.length > 0 && (
            <span className="text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              v{versions[0].versionNumber}
            </span>
          )}
          {hasUnsavedChanges && (
            <span className="ml-2 h-2 w-2 rounded-full" style={{ background: 'var(--tertiary)' }} title="Unsaved changes" />
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Node palette toggle */}
          <button
            onClick={() => setPaletteOpen(!paletteOpen)}
            className="flex items-center gap-2 rounded-2xl px-3 py-2 text-[13px] font-medium transition-opacity"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
          >
            <Plus size={14} />
            Add Node
          </button>

          {notice && (
            <span className="text-[13px]" style={{ color: notice === 'Saved' ? 'var(--status-active)' : 'var(--status-error, #ef4444)' }}>
              {notice}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-2xl px-4 py-2 text-[13px] font-semibold transition-opacity disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>

      {/* Node palette dropdown */}
      {paletteOpen && (
        <div
          className="absolute right-4 top-16 z-20 w-56 rounded-2xl p-2"
          style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}
        >
          {PALETTE_ITEMS.map((item) => (
            <button
              key={item.type}
              onClick={() => addNodeFromPalette(item.type)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-white/5"
              style={{ color: 'var(--on-surface)' }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'labeled' }}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          proOptions={{ hideAttribution: true }}
          style={{ background: 'var(--surface)' }}
        >
          <Background
            color="var(--outline-variant)"
            gap={24}
            size={1}
          />
          <Controls
            showInteractive={false}
            style={{
              background: 'var(--surface-container)',
              borderColor: 'var(--outline-variant)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          />
          <MiniMap
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
            maskColor="rgba(0,0,0,0.6)"
            style={{
              background: 'var(--surface-container)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
