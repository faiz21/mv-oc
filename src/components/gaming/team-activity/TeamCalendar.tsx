'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types'

type TeamActivity = Tables<'team_activity'>

interface EventContent {
  name: string
  description?: string
  start_at: string
  end_at?: string
  event_type: 'team_event' | 'game_session' | 'ritual' | 'birthday'
  discord_link?: string
  teams_link?: string
  recurring?: boolean
}

type CalendarView = 'month' | 'week' | 'day'

const EVENT_COLORS: Record<string, { bg: string; text: string }> = {
  team_event:   { bg: 'rgba(96,165,250,0.2)',  text: '#60a5fa' },
  game_session: { bg: 'rgba(255,193,116,0.2)', text: '#ffc174' },
  ritual:       { bg: 'rgba(192,132,252,0.2)', text: '#c084fc' },
  birthday:     { bg: 'rgba(249,168,212,0.2)', text: '#f9a8d4' },
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  team_event: 'Team Event',
  game_session: 'Game Session',
  ritual: 'Ritual',
  birthday: 'Birthday',
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

interface TeamCalendarProps {
  isAdmin: boolean
}

export function TeamCalendar({ isAdmin }: TeamCalendarProps) {
  const [view, setView] = useState<CalendarView>('month')
  const [cursor, setCursor] = useState(new Date())
  const [events, setEvents] = useState<TeamActivity[]>([])
  const [selectedEvent, setSelectedEvent] = useState<TeamActivity | null>(null)
  const [rsvpState, setRsvpState] = useState<Record<string, string>>({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)

  // Create form state
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formType, setFormType] = useState<EventContent['event_type']>('team_event')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formDiscord, setFormDiscord] = useState('')

  const loadEvents = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('team_activity')
      .select('*')
      .eq('type', 'event')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setEvents(data || [])
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  // Realtime subscription for new events
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('team-activity:events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'team_activity',
        filter: 'type=eq.event',
      }, () => { loadEvents() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadEvents])

  function parseEventContent(event: TeamActivity): EventContent | null {
    try {
      const c = event.content as unknown
      if (typeof c === 'object' && c !== null && 'name' in c) {
        return c as EventContent
      }
      return null
    } catch {
      return null
    }
  }

  function getEventsForDay(date: Date): TeamActivity[] {
    return events.filter(e => {
      const c = parseEventContent(e)
      if (!c?.start_at) return false
      return isSameDay(new Date(c.start_at), date)
    })
  }

  async function handleRSVP(eventId: string, status: 'going' | 'not_going' | 'maybe') {
    const res = await fetch(`/api/gaming/team-activity/${eventId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: { rsvp: status } }),
    })
    if (res.ok) {
      setRsvpState(prev => ({ ...prev, [eventId]: status }))
    }
  }

  function exportIcal(event: TeamActivity) {
    const c = parseEventContent(event)
    if (!c) return
    const start = new Date(c.start_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const end = c.end_at ? new Date(c.end_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : start
    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${c.name}`,
      `DESCRIPTION:${c.description || ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ical], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${c.name.replace(/\s+/g, '-')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCreateEvent() {
    if (!formName.trim() || !formStart) return
    setCreating(true)
    const content: EventContent = {
      name: formName.trim(),
      description: formDesc.trim() || undefined,
      start_at: new Date(formStart).toISOString(),
      end_at: formEnd ? new Date(formEnd).toISOString() : undefined,
      event_type: formType,
      discord_link: formDiscord.trim() || undefined,
    }
    const res = await fetch('/api/gaming/team-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'event', content }),
    })
    if (res.ok) {
      setShowCreateForm(false)
      setFormName('')
      setFormDesc('')
      setFormStart('')
      setFormEnd('')
      setFormDiscord('')
      loadEvents()
    }
    setCreating(false)
  }

  // Month view rendering
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date()

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  function prevPeriod() {
    const d = new Date(cursor)
    if (view === 'month') d.setMonth(d.getMonth() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else d.setDate(d.getDate() - 1)
    setCursor(d)
  }
  function nextPeriod() {
    const d = new Date(cursor)
    if (view === 'month') d.setMonth(d.getMonth() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else d.setDate(d.getDate() + 1)
    setCursor(d)
  }

  const calendarCells: Array<{ date: Date | null }> = []
  for (let i = 0; i < firstDay; i++) calendarCells.push({ date: null })
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push({ date: new Date(year, month, d) })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prevPeriod}
            className="rounded-xl p-1.5 transition-colors hover:bg-white/5"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[120px] text-center text-[14px] font-medium" style={{ color: 'var(--on-surface)' }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextPeriod}
            className="rounded-xl p-1.5 transition-colors hover:bg-white/5"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface-container-low)' }}>
            {(['month', 'week', 'day'] as CalendarView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="rounded-lg px-3 py-1 text-[12px] capitalize transition-colors"
                style={{
                  background: view === v ? 'var(--surface-container)' : 'transparent',
                  color: view === v ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3">
            {Object.entries(EVENT_COLORS).map(([type, colors]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ background: colors.text }} />
                <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>{EVENT_TYPE_LABELS[type]}</span>
              </div>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(f => !f)}
              className="rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
            >
              + Event
            </button>
          )}
        </div>
      </div>

      {/* Create event form (admin only) */}
      {isAdmin && showCreateForm && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--surface-container-low)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>New Event</span>
            <button onClick={() => setShowCreateForm(false)} style={{ color: 'var(--on-surface-variant)' }}>
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Name *</label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                maxLength={100}
                placeholder="Event name"
                className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Type</label>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value as EventContent['event_type'])}
                className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              >
                {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Start *</label>
              <input
                type="datetime-local"
                value={formStart}
                onChange={e => setFormStart(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>End</label>
              <input
                type="datetime-local"
                value={formEnd}
                onChange={e => setFormEnd(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Description</label>
              <textarea
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full resize-none rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Discord/Teams Link</label>
              <input
                value={formDiscord}
                onChange={e => setFormDiscord(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              />
            </div>
          </div>
          <button
            onClick={handleCreateEvent}
            disabled={creating || !formName.trim() || !formStart}
            className="rounded-xl px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
          >
            {creating ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      )}

      {/* Month grid */}
      {view === 'month' && (
        <div>
          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7">
            {DAY_NAMES.map(d => (
              <div key={d} className="py-1 text-center text-[11px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                {d}
              </div>
            ))}
          </div>
          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, i) => {
              if (!cell.date) return <div key={`empty-${i}`} />
              const dayEvents = getEventsForDay(cell.date)
              const isToday = isSameDay(cell.date, today)
              return (
                <div
                  key={cell.date.getTime()}
                  className="min-h-[72px] rounded-xl p-1.5 transition-colors"
                  style={{
                    background: isToday ? 'rgba(255,193,116,0.08)' : 'var(--surface-container-low)',
                    border: isToday ? '1px solid rgba(255,193,116,0.2)' : '1px solid transparent',
                  }}
                >
                  <div
                    className="mb-1 text-right text-[12px] font-medium"
                    style={{ color: isToday ? 'var(--primary)' : 'var(--on-surface-variant)' }}
                  >
                    {cell.date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(ev => {
                      const c = parseEventContent(ev)
                      if (!c) return null
                      const colors = EVENT_COLORS[c.event_type] || EVENT_COLORS['team_event']
                      return (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="w-full truncate rounded px-1 py-0.5 text-left text-[11px]"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {c.name}
                        </button>
                      )
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week view */}
      {view === 'week' && (
        <div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(cursor)
              const dayOfWeek = d.getDay()
              d.setDate(d.getDate() - dayOfWeek + i)
              const dayEvents = getEventsForDay(d)
              const isToday = isSameDay(d, today)
              return (
                <div
                  key={i}
                  className="rounded-xl p-2"
                  style={{
                    background: isToday ? 'rgba(255,193,116,0.08)' : 'var(--surface-container-low)',
                    border: isToday ? '1px solid rgba(255,193,116,0.2)' : '1px solid transparent',
                    minHeight: 120,
                  }}
                >
                  <div className="mb-2 text-center">
                    <div className="text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>{DAY_NAMES[i]}</div>
                    <div className="text-[14px] font-medium" style={{ color: isToday ? 'var(--primary)' : 'var(--on-surface)' }}>
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map(ev => {
                      const c = parseEventContent(ev)
                      if (!c) return null
                      const colors = EVENT_COLORS[c.event_type] || EVENT_COLORS['team_event']
                      return (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="w-full truncate rounded px-1.5 py-1 text-left text-[11px]"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {c.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Day view */}
      {view === 'day' && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface-container-low)' }}>
          <div className="mb-3 text-[14px] font-medium" style={{ color: 'var(--on-surface)' }}>
            {cursor.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {getEventsForDay(cursor).length === 0 ? (
            <div className="py-6 text-center text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
              No events today.
            </div>
          ) : (
            <div className="space-y-2">
              {getEventsForDay(cursor).map(ev => {
                const c = parseEventContent(ev)
                if (!c) return null
                const colors = EVENT_COLORS[c.event_type] || EVENT_COLORS['team_event']
                return (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="w-full rounded-xl px-4 py-3 text-left"
                    style={{ background: colors.bg }}
                  >
                    <div className="text-[14px] font-medium" style={{ color: colors.text }}>{c.name}</div>
                    <div className="mt-0.5 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                      {new Date(c.start_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (() => {
        const c = parseEventContent(selectedEvent)
        if (!c) return null
        const colors = EVENT_COLORS[c.event_type] || EVENT_COLORS['team_event']
        const currentRsvp = rsvpState[selectedEvent.id]
        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6 space-y-4"
              style={{ background: 'var(--surface)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className="mb-1 inline-block rounded-full px-2 py-0.5 text-[11px]"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {EVENT_TYPE_LABELS[c.event_type]}
                  </div>
                  <h3 className="text-[18px] font-semibold" style={{ color: 'var(--on-surface)' }}>{c.name}</h3>
                </div>
                <button onClick={() => setSelectedEvent(null)} style={{ color: 'var(--on-surface-variant)' }}>
                  <X size={16} />
                </button>
              </div>

              {c.description && (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{c.description}</p>
              )}

              <div className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
                {new Date(c.start_at).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {c.end_at && ` – ${new Date(c.end_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
              </div>

              {(c.discord_link || c.teams_link) && (
                <a
                  href={c.discord_link || c.teams_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[13px]"
                  style={{ color: 'var(--primary)' }}
                >
                  Join meeting
                </a>
              )}

              {/* RSVP */}
              <div>
                <div className="mb-2 text-[12px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Your RSVP</div>
                <div className="flex gap-2">
                  {(['going', 'maybe', 'not_going'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => handleRSVP(selectedEvent.id, status)}
                      className="flex-1 rounded-xl py-2 text-[12px] font-medium transition-colors"
                      style={{
                        background: currentRsvp === status ? colors.bg : 'var(--surface-container)',
                        color: currentRsvp === status ? colors.text : 'var(--on-surface-variant)',
                        border: `1px solid ${currentRsvp === status ? colors.text + '44' : 'transparent'}`,
                      }}
                    >
                      {status === 'going' ? 'Going' : status === 'maybe' ? 'Maybe' : 'Not Going'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => exportIcal(selectedEvent)}
                className="w-full rounded-xl py-2 text-[12px] transition-colors"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
              >
                Export as iCal
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
