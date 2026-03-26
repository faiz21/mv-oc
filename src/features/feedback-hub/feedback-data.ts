import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ─── Canonical types ──────────────────────────────────────────────────────────

export type FeedbackCategory = 'idea' | 'problem' | 'request' | 'general'
export type FeedbackStatus = 'received' | 'under_review' | 'responded' | 'closed'

export interface FeedbackItem {
  id: string
  userId: string | null // NULL for anonymous — never exposed in UI for admin
  category: FeedbackCategory
  content: string
  status: FeedbackStatus
  response: string | null
  responseAt: string | null
  closedAt: string | null
  closedReason: string | null
  createdAt: string
  updatedAt: string
}

export interface ChangelogEntry {
  id: string
  title: string
  description: string
  category: string | null
  status: 'draft' | 'published'
  relatedFeedback: string[] | null
  createdAt: string
  publishedAt: string | null
  publishedBy: string | null
}

export interface PulseSurvey {
  id: string
  title: string
  description: string | null
  questions: SurveyQuestion[]
  status: 'draft' | 'published' | 'closed'
  sentAt: string | null
  closesAt: string | null
  createdBy: string
  createdAt: string
}

export type QuestionType = 'multiple_choice' | 'rating_scale' | 'free_text'

export interface SurveyQuestion {
  id: string
  text: string
  type: QuestionType
  options?: string[]      // multiple_choice
  range?: [number, number] // rating_scale e.g. [1,5]
  charLimit?: number      // free_text
}

export interface TrendMetrics {
  responseRate: number        // 0–1
  avgDaysToResponse: number | null
  avgDaysToClose: number | null
  pendingCount: number
}

export interface WeeklyVolume {
  weekStart: string // ISO date
  idea: number
  problem: number
  request: number
  general: number
}

// ─── ANONYMOUS display constant ───────────────────────────────────────────────
// Rule: never derive display name from data. Always hardcoded.
export const ANONYMOUS_DISPLAY_NAME = 'Team Member' as const

// ─── Feedback queries ─────────────────────────────────────────────────────────

/** Admin inbox: all feedback, ordered by status priority then created_at. */
export async function getAllFeedback(
  supabase: SupabaseClient<Database>,
  filters?: {
    category?: FeedbackCategory
    status?: FeedbackStatus
    search?: string
    startDate?: string
    endDate?: string
  },
): Promise<FeedbackItem[]> {
  let query = supabase
    .from('feedback')
    .select('id, user_id, category, content, status, response, response_at, closed_at, closed_reason, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.startDate) query = query.gte('created_at', filters.startDate)
  if (filters?.endDate) query = query.lte('created_at', filters.endDate)
  if (filters?.search) {
    // Search content only — cannot search submitter name for anonymous rows
    query = query.ilike('content', `%${filters.search}%`)
  }

  const { data, error } = await query.limit(100)
  if (error) throw error

  return (data ?? []).map(rowToFeedbackItem)
}

/** Member view: only own feedback (RLS enforces this; user_id = auth.uid()). */
export async function getMyFeedback(
  supabase: SupabaseClient<Database>,
): Promise<FeedbackItem[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('id, user_id, category, content, status, response, response_at, closed_at, closed_reason, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? []).map(rowToFeedbackItem)
}

/** Single feedback item by id. */
export async function getFeedbackById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<FeedbackItem | null> {
  const { data, error } = await supabase
    .from('feedback')
    .select('id, user_id, category, content, status, response, response_at, closed_at, closed_reason, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) return null
  return rowToFeedbackItem(data)
}

// ─── Changelog queries ────────────────────────────────────────────────────────

/** All roles: published changelog entries. */
export async function getPublishedChangelog(
  supabase: SupabaseClient<Database>,
  filters?: { category?: string; search?: string },
): Promise<ChangelogEntry[]> {
  let query = supabase
    .from('changelog')
    .select('id, title, description, category, status, related_feedback, created_at, published_at, published_by')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(rowToChangelogEntry)
}

/** Admin only: all changelog entries (draft + published). */
export async function getAllChangelog(
  supabase: SupabaseClient<Database>,
): Promise<ChangelogEntry[]> {
  const { data, error } = await supabase
    .from('changelog')
    .select('id, title, description, category, status, related_feedback, created_at, published_at, published_by')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? []).map(rowToChangelogEntry)
}

// ─── Pulse survey queries ─────────────────────────────────────────────────────

/** Published surveys visible to all team members. */
export async function getActiveSurveys(
  supabase: SupabaseClient<Database>,
): Promise<PulseSurvey[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('pulse_surveys')
    .select('id, title, description, questions, status, sent_at, closes_at, created_by, created_at')
    .eq('status', 'published')
    .or(`closes_at.is.null,closes_at.gt.${now}`)
    .lte('sent_at', now)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(rowToSurvey)
}

/** Admin: all surveys. */
export async function getAllSurveys(
  supabase: SupabaseClient<Database>,
): Promise<PulseSurvey[]> {
  const { data, error } = await supabase
    .from('pulse_surveys')
    .select('id, title, description, questions, status, sent_at, closes_at, created_by, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? []).map(rowToSurvey)
}

/** Survey by id. */
export async function getSurveyById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<PulseSurvey | null> {
  const { data, error } = await supabase
    .from('pulse_surveys')
    .select('id, title, description, questions, status, sent_at, closes_at, created_by, created_at')
    .eq('id', id)
    .single()

  if (error) return null
  return rowToSurvey(data)
}

// ─── Trends / metrics queries ─────────────────────────────────────────────────

/** Aggregate feedback metrics for the trends view (admin only). */
export async function getFeedbackMetrics(
  supabase: SupabaseClient<Database>,
  filters?: { startDate?: string; endDate?: string; category?: FeedbackCategory },
): Promise<TrendMetrics> {
  let query = supabase
    .from('feedback')
    .select('status, response_at, closed_at, created_at')

  if (filters?.startDate) query = query.gte('created_at', filters.startDate)
  if (filters?.endDate) query = query.lte('created_at', filters.endDate)
  if (filters?.category) query = query.eq('category', filters.category)

  const { data, error } = await query
  if (error) throw error

  const rows = data ?? []
  const total = rows.length
  const responded = rows.filter(r => r.status === 'responded' || r.status === 'closed').length
  const pending = rows.filter(r => r.status === 'received' || r.status === 'under_review').length

  const responseTimes = rows
    .filter(r => r.response_at != null)
    .map(r => (new Date(r.response_at!).getTime() - new Date(r.created_at).getTime()) / 86_400_000)

  const closeTimes = rows
    .filter(r => r.status === 'closed' && r.closed_at != null)
    .map(r => (new Date(r.closed_at!).getTime() - new Date(r.created_at).getTime()) / 86_400_000)

  return {
    responseRate: total > 0 ? responded / total : 0,
    avgDaysToResponse: responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : null,
    avgDaysToClose: closeTimes.length > 0
      ? closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length
      : null,
    pendingCount: pending,
  }
}

/** Weekly volume breakdown for chart (last N weeks). */
export async function getWeeklyVolume(
  supabase: SupabaseClient<Database>,
  weeks = 8,
  category?: FeedbackCategory,
): Promise<WeeklyVolume[]> {
  const start = new Date()
  start.setDate(start.getDate() - weeks * 7)

  let query = supabase
    .from('feedback')
    .select('category, created_at')
    .gte('created_at', start.toISOString())
    .order('created_at', { ascending: true })

  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) throw error

  // Group by ISO week start (Monday)
  const map = new Map<string, WeeklyVolume>()

  for (const row of data ?? []) {
    const d = new Date(row.created_at)
    const monday = new Date(d)
    const day = monday.getDay()
    const diff = day === 0 ? -6 : 1 - day
    monday.setDate(monday.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    const key = monday.toISOString().slice(0, 10)

    if (!map.has(key)) {
      map.set(key, { weekStart: key, idea: 0, problem: 0, request: 0, general: 0 })
    }
    const bucket = map.get(key)!
    const cat = row.category as FeedbackCategory
    if (cat === 'idea') bucket.idea++
    else if (cat === 'problem') bucket.problem++
    else if (cat === 'request') bucket.request++
    else if (cat === 'general') bucket.general++
  }

  // Return sorted by week, filling empty weeks
  const result: WeeklyVolume[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff - i * 7)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    result.push(map.get(key) ?? { weekStart: key, idea: 0, problem: 0, request: 0, general: 0 })
  }

  return result
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToFeedbackItem(row: {
  id: string
  user_id: string | null
  category: string
  content: string
  status: string
  response: string | null
  response_at: string | null
  closed_at: string | null
  closed_reason: string | null
  created_at: string
  updated_at: string
}): FeedbackItem {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category as FeedbackCategory,
    content: row.content,
    status: row.status as FeedbackStatus,
    response: row.response,
    responseAt: row.response_at,
    closedAt: row.closed_at,
    closedReason: row.closed_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToChangelogEntry(row: {
  id: string
  title: string
  description: string
  category: string | null
  status: string
  related_feedback: string[] | null
  created_at: string
  published_at: string | null
  published_by: string | null
}): ChangelogEntry {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status as 'draft' | 'published',
    relatedFeedback: row.related_feedback,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    publishedBy: row.published_by,
  }
}

function rowToSurvey(row: {
  id: string
  title: string
  description: string | null
  questions: unknown
  status: string
  sent_at: string | null
  closes_at: string | null
  created_by: string
  created_at: string
}): PulseSurvey {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    questions: (row.questions as SurveyQuestion[]) ?? [],
    status: row.status as 'draft' | 'published' | 'closed',
    sentAt: row.sent_at,
    closesAt: row.closes_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}
