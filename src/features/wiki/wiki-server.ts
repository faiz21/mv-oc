import 'server-only'

import { execFile } from 'node:child_process'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { cache } from 'react'
import type { TOCItemType } from 'fumadocs-core/toc'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types'
import { normalizeRole, type StoredRole } from '@/lib/roles'
import {
  buildCategoryTree,
  buildSearchResults,
  buildSourceArticleRecord,
  canEditArticle,
  canReadArticle,
  createSearchSnippet,
  deriveArticleDescription,
  getSourceArticlePathFromId,
  isSourceArticleId,
  summarizeArticleStatus,
  type WikiArticleRecord,
} from './wiki-content'

const execFileAsync = promisify(execFile)
const WIKI_SOURCE_ROOT = path.resolve(process.cwd(), '..', 'MV-Operating System')
const ZIP_SIGNATURE = 'PK'

export interface WikiVersionRecord {
  id: string
  article_id: string
  version_number: number
  content: string
  change_summary: string | null
  edited_by: string | null
  created_at: string
}

export interface WikiReviewQueueArticle {
  article: WikiArticleRecord
  approval: Tables<'approval_queue'>
  previousVersion: WikiVersionRecord | null
}

export async function getWikiContext(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profileResult = user
    ? await supabase.from('profiles').select('id, full_name, role, email').eq('id', user.id).maybeSingle()
    : { data: null }

  return {
    user,
    profile: profileResult.data,
    role: normalizeRole(profileResult.data?.role),
  }
}

export const listSourceWikiArticles = cache(async (): Promise<WikiArticleRecord[]> => {
  const filePaths = await collectMarkdownFiles(WIKI_SOURCE_ROOT)
  const articles = await Promise.all(
    filePaths.map(async (absolutePath) => {
      const [fileStat, content] = await Promise.all([
        stat(absolutePath),
        readMarkdownSource(absolutePath),
      ])
      const relativePath = path.relative(WIKI_SOURCE_ROOT, absolutePath).replace(/\\/g, '/')

      return buildSourceArticleRecord({
        relativePath,
        content,
        updatedAt: fileStat.mtime.toISOString(),
      })
    }),
  )

  return articles.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
})

export async function listVisibleWikiArticles(
  supabase: SupabaseClient<Database>,
  options: {
    role: StoredRole
    userId?: string | null
    search?: string | null
    status?: 'draft' | 'review' | 'published' | 'archived' | 'all'
  },
) {
  const dbArticles = await listDatabaseWikiArticles(supabase)
  const visibleDatabaseArticles = dbArticles.filter((article) =>
    canReadArticle(article, { role: options.role, userId: options.userId }),
  )

  const includeSourceArticles =
    !options.status || options.status === 'all' || options.status === 'published'
  const sourceArticles = includeSourceArticles ? await listSourceWikiArticles() : []

  const scopedArticles = [...visibleDatabaseArticles, ...sourceArticles]
    .filter((article) => options.status === 'all' || !options.status || article.status === options.status)
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))

  const searchResults = options.search
    ? buildSearchResults(scopedArticles, options.search).map((article) => ({
        ...article,
        canEdit: canEditArticle(article, { role: options.role, userId: options.userId }),
      }))
    : scopedArticles.map((article) => ({
        ...article,
        snippet: article.description ?? createSearchSnippet(article, article.title),
        score: 0,
        canEdit: canEditArticle(article, { role: options.role, userId: options.userId }),
      }))

  return {
    articles: scopedArticles,
    categoryTree: buildCategoryTree(scopedArticles),
    statusSummary: summarizeArticleStatus(scopedArticles),
    searchResults,
  }
}

export async function getWikiArticle(
  supabase: SupabaseClient<Database>,
  id: string,
  options: { role: StoredRole; userId?: string | null },
) {
  const article = isSourceArticleId(id)
    ? await getSourceWikiArticle(id)
    : await getDatabaseWikiArticle(supabase, id)

  if (!article) return null
  if (!canReadArticle(article, { role: options.role, userId: options.userId })) {
    return null
  }

  const rejectionReason =
    article.source === 'database'
      ? await getLatestRejectionReason(supabase, article.id)
      : null

  return {
    article,
    toc: buildWikiToc(article.content),
    canEdit: canEditArticle(article, { role: options.role, userId: options.userId }),
    rejectionReason,
  }
}

export async function getWikiVersions(
  supabase: SupabaseClient<Database>,
  articleId: string,
): Promise<WikiVersionRecord[]> {
  if (isSourceArticleId(articleId)) return []

  const result = await supabase
    .from('wiki_versions')
    .select('id, article_id, version_number, content, change_summary, edited_by, created_at')
    .eq('article_id', articleId)
    .order('version_number', { ascending: false })

  return (result.data ?? []) as WikiVersionRecord[]
}

export async function getWikiCategorySuggestions(supabase: SupabaseClient<Database>) {
  const [databaseArticles, sourceArticles] = await Promise.all([
    listDatabaseWikiArticles(supabase),
    listSourceWikiArticles(),
  ])

  return Array.from(
    new Set([...databaseArticles, ...sourceArticles].map((article) => article.category).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right))
}

export async function getReviewQueueArticles(
  supabase: SupabaseClient<Database>,
): Promise<WikiReviewQueueArticle[]> {
  const [articlesResult, approvalsResult, versionsResult] = await Promise.all([
    supabase
      .from('wiki_articles')
      .select('id, title, category, content, status, author_id, editor_id, published_at, archived_at, deleted_at, updated_at')
      .eq('status', 'review')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false }),
    supabase
      .from('approval_queue')
      .select('*')
      .eq('source_type', 'wiki_article')
      .eq('status', 'awaiting_review')
      .order('created_at', { ascending: false }),
    supabase
      .from('wiki_versions')
      .select('id, article_id, version_number, content, change_summary, edited_by, created_at')
      .order('version_number', { ascending: false }),
  ])

  const approvalsByArticleId = new Map<string, Tables<'approval_queue'>>(
    (approvalsResult.data ?? []).map((approval) => [approval.source_ref, approval]),
  )
  const versionsByArticleId = new Map<string, WikiVersionRecord[]>()

  for (const version of (versionsResult.data ?? []) as WikiVersionRecord[]) {
    const articleVersions = versionsByArticleId.get(version.article_id) ?? []
    articleVersions.push(version)
    versionsByArticleId.set(version.article_id, articleVersions)
  }

  return ((articlesResult.data ?? []) as Tables<'wiki_articles'>[])
    .map((row) => {
      const approval = approvalsByArticleId.get(row.id)
      if (!approval) return null

      const versions = versionsByArticleId.get(row.id) ?? []
      const previousVersion =
        versions.find((version) => version.content.trim() !== row.content.trim()) ?? null

      return {
        article: mapDatabaseArticle(row),
        approval,
        previousVersion,
      } satisfies WikiReviewQueueArticle
    })
    .filter((entry): entry is WikiReviewQueueArticle => Boolean(entry))
}

export function buildWikiToc(markdown: string): TOCItemType[] {
  return markdown
    .split('\n')
    .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      title: match[2].trim(),
      url: `#${slugify(match[2])}`,
      depth: match[1].length - 1,
    }))
}

async function listDatabaseWikiArticles(supabase: SupabaseClient<Database>) {
  const result = await supabase
    .from('wiki_articles')
    .select('id, title, category, content, status, author_id, editor_id, published_at, archived_at, deleted_at, updated_at')
    .order('updated_at', { ascending: false })

  return ((result.data ?? []) as Tables<'wiki_articles'>[]).map(mapDatabaseArticle)
}

async function getDatabaseWikiArticle(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<WikiArticleRecord | null> {
  const result = await supabase
    .from('wiki_articles')
    .select('id, title, category, content, status, author_id, editor_id, published_at, archived_at, deleted_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (!result.data) return null
  return mapDatabaseArticle(result.data as Tables<'wiki_articles'>)
}

async function getSourceWikiArticle(articleId: string): Promise<WikiArticleRecord | null> {
  const sourcePath = getSourceArticlePathFromId(articleId)
  if (!sourcePath) return null

  const absolutePath = path.resolve(WIKI_SOURCE_ROOT, sourcePath)

  try {
    const [fileStat, content] = await Promise.all([
      stat(absolutePath),
      readMarkdownSource(absolutePath),
    ])

    return buildSourceArticleRecord({
      relativePath: sourcePath,
      content,
      updatedAt: fileStat.mtime.toISOString(),
    })
  } catch {
    return null
  }
}

async function getLatestRejectionReason(
  supabase: SupabaseClient<Database>,
  articleId: string,
): Promise<string | null> {
  const result = await supabase
    .from('approval_queue')
    .select('notes')
    .eq('source_type', 'wiki_article')
    .eq('source_ref', articleId)
    .eq('status', 'rejected')
    .order('decision_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return result.data?.notes?.trim() || null
}

function mapDatabaseArticle(row: Tables<'wiki_articles'>): WikiArticleRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: deriveArticleDescription(row.content) || null,
    content: row.content,
    status: row.status as WikiArticleRecord['status'],
    authorId: row.author_id,
    source: 'database',
    sourcePath: null,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at,
    updatedAt: row.updated_at,
  }
}

async function collectMarkdownFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(root, entry.name)
      if (entry.isDirectory()) return collectMarkdownFiles(fullPath)
      if (entry.isFile() && entry.name.endsWith('.md')) return [fullPath]
      return []
    }),
  )

  return files.flat()
}

async function readMarkdownSource(absolutePath: string) {
  const buffer = await readFile(absolutePath)

  if (buffer.subarray(0, 2).toString('utf8') === ZIP_SIGNATURE) {
    const extracted = await readZipWrappedMarkdown(absolutePath)
    if (extracted) return extracted
  }

  if (isProbablyBinary(buffer)) {
    return [
      '# Source Document Unavailable',
      '',
      `The source file at \`${path.basename(absolutePath)}\` is not stored as plain markdown in this workspace.`,
      'Open the original asset to review its contents.',
    ].join('\n')
  }

  return buffer.toString('utf8')
}

async function readZipWrappedMarkdown(absolutePath: string) {
  try {
    const { stdout } = await execFileAsync('unzip', ['-p', absolutePath], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    })

    return stdout.trim() ? stdout : null
  } catch {
    return null
  }
}

function isProbablyBinary(buffer: Buffer) {
  const sample = buffer.subarray(0, 512)
  let suspiciousBytes = 0

  for (const byte of sample) {
    if (byte === 9 || byte === 10 || byte === 13) continue
    if (byte >= 32 && byte <= 126) continue
    if (byte >= 160) continue
    suspiciousBytes += 1
  }

  return suspiciousBytes > sample.length * 0.2
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}
