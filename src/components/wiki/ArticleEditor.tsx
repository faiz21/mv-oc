'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const CATEGORY_SUGGESTIONS = ['standards', 'sop', 'policies', 'guides', 'reference']
const ARTICLE_TEMPLATES = {
  standard: '# Purpose\n\n## Scope\n\n## Requirements\n\n## Review Notes\n',
  guide: '# Overview\n\n## Steps\n\n## Tips\n',
  sop: '# Objective\n\n## Preconditions\n\n## Procedure\n\n## Escalation\n',
  prd: '# Problem\n\n## Users\n\n## Scope\n\n## Acceptance Criteria\n',
  other: '# Notes\n\n',
} as const

interface ArticleEditorProps {
  articleId?: string
  initialValue?: {
    title: string
    category: string
    description: string
    content: string
  }
  initialStatus?: 'draft' | 'review'
  categorySuggestions?: string[]
  rejectionReason?: string | null
}

export function ArticleEditor({
  articleId,
  initialValue,
  initialStatus = 'draft',
  categorySuggestions,
  rejectionReason,
}: ArticleEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialValue?.title ?? '')
  const [category, setCategory] = useState(initialValue?.category ?? '')
  const [description, setDescription] = useState(initialValue?.description ?? '')
  const [content, setContent] = useState(initialValue?.content ?? '# New Article\n\nStart writing here.')
  const [template, setTemplate] = useState<keyof typeof ARTICLE_TEMPLATES>('other')
  const [changeSummary, setChangeSummary] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const previewMarkdown = useDeferredValue(content)
  const suggestions = useMemo(
    () => Array.from(new Set([...(categorySuggestions ?? []), ...CATEGORY_SUGGESTIONS])).sort((left, right) => left.localeCompare(right)),
    [categorySuggestions],
  )
  const draftStatus = articleId && initialStatus === 'review' ? 'review' : 'draft'

  const canSubmitForReview = content.trim().length >= 100

  useEffect(() => {
    if (!dirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  useEffect(() => {
    if (!articleId) return

    const handle = window.setInterval(() => {
      if (!title.trim() || !category.trim() || !content.trim() || saving) return
      void saveDraft('autosave')
    }, 30000)

    return () => window.clearInterval(handle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, title, category, content, saving])

  async function saveDraft(mode: 'manual' | 'autosave' = 'manual'): Promise<string | undefined> {
    setSaving(true)
    setStatusMessage(mode === 'autosave' ? 'Autosaving draft…' : 'Saving draft…')

    const isNew = !articleId
    const url = isNew ? '/api/wiki/articles' : `/api/wiki/articles/${articleId}`
    const method = isNew ? 'POST' : 'PUT'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category,
        description,
        content,
        status: draftStatus,
        changeSummary: mode === 'autosave' ? 'Autosave' : changeSummary,
      }),
    })

    const payload = await response.json()
    setSaving(false)

    if (!response.ok) {
      setStatusMessage(payload.error ?? 'Unable to save the draft.')
      return undefined
    }

    setStatusMessage(mode === 'autosave' ? 'Draft autosaved.' : 'Draft saved.')
    setLastSavedAt(new Date().toLocaleTimeString())
    setDirty(false)

    if (isNew && payload.id) {
      startTransition(() => {
        router.replace(`/wiki/article/${payload.id}/edit`)
      })
    }

    return (typeof payload.id === 'string' ? payload.id : articleId) ?? undefined
  }

  async function submitForReview() {
    if (!canSubmitForReview) return

    setSaving(true)
    setStatusMessage('Submitting for review…')

    let savedId = articleId
    if (!savedId) {
      savedId = await saveDraft('manual')
      if (!savedId) {
        setSaving(false)
        return
      }
    }

    const response = await fetch(`/api/wiki/articles/${savedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category,
        description,
        content,
        status: 'review',
        changeSummary: changeSummary || 'Submitted for review',
      }),
    })

    const payload = await response.json()
    setSaving(false)

    if (!response.ok) {
      setStatusMessage(payload.error ?? 'Unable to submit the article for review.')
      return
    }

    setStatusMessage('Article moved to review.')
    setLastSavedAt(new Date().toLocaleTimeString())
    setDirty(false)
    startTransition(() => {
      router.push(`/wiki/article/${payload.id ?? savedId}`)
      router.refresh()
    })
  }

  function applyTemplate(nextTemplate: keyof typeof ARTICLE_TEMPLATES) {
    setTemplate(nextTemplate)
    if (!content.trim() || content === initialValue?.content) {
      setContent(ARTICLE_TEMPLATES[nextTemplate])
      setDirty(true)
    }
  }

  function insertMarkdown(before: string, after = '') {
    const textarea = textareaRef.current
    if (!textarea) return

    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const selected = content.slice(selectionStart, selectionEnd)
    const replacement = `${before}${selected}${after}`
    const nextContent =
      content.slice(0, selectionStart) + replacement + content.slice(selectionEnd)

    setContent(nextContent)
    setDirty(true)

    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = selectionStart + replacement.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <section
        className="rounded-[26px] border px-5 py-5"
        style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>
          Editor
        </div>
        <div className="mt-4 grid gap-4">
          <Field label="Title">
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setDirty(true)
              }}
              className={inputClassName}
              style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
              placeholder="Workflow Standards"
            />
          </Field>
          <Field label="Category">
            <input
              value={category}
              onChange={(event) => {
                setCategory(event.target.value)
                setDirty(true)
              }}
              className={inputClassName}
              style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
              placeholder="standards"
              list="wiki-category-suggestions"
            />
            <datalist id="wiki-category-suggestions">
              {suggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </Field>
          <Field label="Template">
            <select
              value={template}
              onChange={(event) => applyTemplate(event.target.value as keyof typeof ARTICLE_TEMPLATES)}
              className={inputClassName}
              style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
            >
              <option value="standard">Standard</option>
              <option value="guide">Guide</option>
              <option value="sop">SOP</option>
              <option value="prd">PRD</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                setDirty(true)
              }}
              className={`${inputClassName} min-h-24`}
              style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
              placeholder="Short summary for search and browse views."
            />
          </Field>
          <Field label="Change Summary">
            <input
              value={changeSummary}
              onChange={(event) => setChangeSummary(event.target.value)}
              className={inputClassName}
              style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
              placeholder="What changed in this revision?"
            />
          </Field>
          {rejectionReason ? (
            <div className="rounded-[20px] border px-4 py-4 text-sm" style={{ borderColor: 'rgba(248,113,113,0.28)', background: 'rgba(248,113,113,0.08)', color: 'var(--on-surface)' }}>
              <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--status-failed)' }}>
                Rejection Reason
              </div>
              <p className="mt-2 leading-6">{rejectionReason}</p>
            </div>
          ) : null}
          <Field label="Markdown Content">
            <div className="flex flex-wrap gap-2">
              <ToolbarButton label="H2" onClick={() => insertMarkdown('## ')} />
              <ToolbarButton label="Bold" onClick={() => insertMarkdown('**', '**')} />
              <ToolbarButton label="List" onClick={() => insertMarkdown('- ')} />
              <ToolbarButton label="Link" onClick={() => insertMarkdown('[', '](https://)')} />
              <ToolbarButton label="Code" onClick={() => insertMarkdown('`', '`')} />
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => {
                setContent(event.target.value)
                setDirty(true)
              }}
              className={`${inputClassName} min-h-[420px] font-mono text-[13px] leading-6`}
              style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
            />
            <div className="mt-1 text-right text-[11px]" style={{ color: content.trim().length < 100 ? 'var(--primary)' : 'var(--secondary)' }}>
              {content.trim().length} chars {content.trim().length < 100 ? `— ${100 - content.trim().length} more to submit for review` : ''}
            </div>
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={saving}
            className={primaryButton}
            style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)', opacity: saving ? 0.6 : 1 }}
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => void submitForReview()}
            disabled={saving || !canSubmitForReview}
            className={secondaryButton}
            style={{
              borderColor: 'var(--border-default)',
              color: canSubmitForReview ? 'var(--on-surface)' : 'var(--secondary)',
              opacity: saving || !canSubmitForReview ? 0.5 : 1,
              cursor: canSubmitForReview ? 'pointer' : 'not-allowed',
            }}
          >
            Submit for Review
          </button>
        </div>
        {statusMessage ? (
          <div className="mt-4 grid gap-1 text-sm" style={{ color: 'var(--secondary)' }}>
            <p>{statusMessage}</p>
            {lastSavedAt ? <p>Last saved {lastSavedAt}</p> : null}
          </div>
        ) : null}
      </section>

      <section
        className="rounded-[26px] border px-5 py-5"
        style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.03)' }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>
          Preview
        </div>
        <div className="prose prose-invert mt-4 max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewMarkdown}</ReactMarkdown>
        </div>
      </section>
    </div>
  )
}

function ToolbarButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center rounded-full border px-3 text-xs font-semibold"
      style={{ borderColor: 'var(--border-default)', color: 'var(--secondary)' }}
    >
      {label}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClassName = 'w-full rounded-[18px] border px-4 py-3 text-sm outline-none transition-colors'
const primaryButton = 'inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold transition-opacity'
const secondaryButton = 'inline-flex items-center rounded-full border px-5 py-3 text-sm font-semibold transition-opacity'
