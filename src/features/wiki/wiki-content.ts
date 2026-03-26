import { normalizeRole, type StoredRole } from '@/lib/roles'

export type WikiArticleStatus = 'draft' | 'review' | 'published' | 'archived'
export type WikiArticleSource = 'database' | 'source'

export interface WikiArticleRecord {
  id: string
  title: string
  category: string
  description: string | null
  content: string
  status: WikiArticleStatus
  authorId: string | null
  source?: WikiArticleSource
  sourcePath?: string | null
  publishedAt: string | null
  archivedAt: string | null
  deletedAt: string | null
  updatedAt: string
}

export interface WikiAccessContext {
  role: StoredRole
  userId: string | null | undefined
}

export interface WikiCategoryNode {
  label: string
  path: string
  articleCount: number
  children: WikiCategoryNode[]
}

export interface WikiSearchResult extends WikiArticleRecord {
  snippet: string
  score: number
}

export interface WikiSearchPage {
  items: WikiSearchResult[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function buildCategoryTree(articles: WikiArticleRecord[]) {
  const nodes = new Map<string, WikiCategoryNode>()

  for (const article of articles) {
    const parts = article.category.split('/').filter(Boolean)
    let currentPath = ''

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      if (!nodes.has(currentPath)) {
        nodes.set(currentPath, {
          label: toTitleCase(part.replace(/[-_]/g, ' ')),
          path: currentPath,
          articleCount: 0,
          children: [],
        })
      }

      nodes.get(currentPath)!.articleCount += 1
    }
  }

  const roots: WikiCategoryNode[] = []

  for (const node of nodes.values()) {
    const parentPath = node.path.includes('/') ? node.path.slice(0, node.path.lastIndexOf('/')) : null
    if (!parentPath) {
      roots.push(node)
      continue
    }

    nodes.get(parentPath)?.children.push(node)
  }

  return sortTree(roots)
}

export function canReadArticle(article: WikiArticleRecord, context: WikiAccessContext) {
  const role = normalizeRole(context.role)

  if (article.deletedAt) return false
  if (article.status === 'published') return true
  if (role === 'admin') return true
  if (article.status === 'review' && role === 'officer') return true
  if (article.status === 'draft') return context.userId === article.authorId
  if (article.status === 'archived') return false
  return false
}

export function canEditArticle(article: WikiArticleRecord, context: WikiAccessContext) {
  if (resolveSource(article) === 'source') return false

  const role = normalizeRole(context.role)

  if (role === 'admin') return true
  if (article.status !== 'draft') return false
  return role === 'officer' && context.userId === article.authorId
}

export function createSearchSnippet(article: WikiArticleRecord, query: string) {
  const source = `${article.title} ${article.description ?? ''} ${article.content}`.replace(/\s+/g, ' ').trim()
  const matchIndex = source.toLowerCase().indexOf(query.toLowerCase())

  if (matchIndex === -1) return source.slice(0, 160)

  const start = Math.max(0, matchIndex - 60)
  const end = Math.min(source.length, matchIndex + query.length + 80)
  return source.slice(start, end)
}

export function normalizeCategoryLabel(category: string) {
  return category
    .split('/')
    .filter(Boolean)
    .map((part) => toTitleCase(part.replace(/[-_]/g, ' ')))
    .join(' / ')
}

export function summarizeArticleStatus(articles: WikiArticleRecord[]) {
  return articles.reduce(
    (summary, article) => {
      summary[article.status] += 1
      return summary
    },
    { published: 0, draft: 0, review: 0, archived: 0 } satisfies Record<WikiArticleStatus, number>,
  )
}

export function buildSearchResults(articles: WikiArticleRecord[], query: string): WikiSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  return articles
    .map((article) => {
      const title = article.title.toLowerCase()
      const category = article.category.toLowerCase()
      const content = article.content.toLowerCase()
      const description = (article.description ?? '').toLowerCase()

      let score = 0
      if (title.includes(normalizedQuery)) score += 6
      if (title.startsWith(normalizedQuery)) score += 4
      if (category.includes(normalizedQuery)) score += 3
      if (description.includes(normalizedQuery)) score += 2
      if (content.includes(normalizedQuery)) score += 1

      return {
        ...article,
        snippet: createSearchSnippet(article, normalizedQuery),
        score,
      }
    })
    .filter((article) => article.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
    })
}

export function paginateSearchResults(
  results: WikiSearchResult[],
  page: number,
  pageSize = 10,
): WikiSearchPage {
  const safePageSize = Math.max(1, pageSize)
  const safePage = Math.max(1, page)
  const total = results.length
  const totalPages = Math.max(1, Math.ceil(total / safePageSize))
  const startIndex = (Math.min(safePage, totalPages) - 1) * safePageSize

  return {
    items: results.slice(startIndex, startIndex + safePageSize),
    page: Math.min(safePage, totalPages),
    pageSize: safePageSize,
    total,
    totalPages,
  }
}

export function deriveArticleDescription(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, '\n')
  const blocks = normalized.split('\n\n').map((block) => block.trim()).filter(Boolean)

  for (const block of blocks) {
    if (block.startsWith('#')) continue
    const singleLine = block.replace(/\n+/g, ' ').trim()
    if (singleLine) return singleLine.slice(0, 180)
  }

  return ''
}

export function buildSourceArticleRecord(input: {
  relativePath: string
  content: string
  updatedAt: string
}): WikiArticleRecord {
  const normalizedPath = normalizeSourcePath(input.relativePath)
  const fileName = normalizedPath.split('/').pop() ?? normalizedPath
  const fileStem = fileName.replace(/\.[^.]+$/, '')
  const category = normalizedPath.includes('/')
    ? normalizedPath.slice(0, normalizedPath.lastIndexOf('/'))
    : 'general'

  return {
    id: createSourceArticleId(normalizedPath),
    title: toTitleCase(fileStem.replace(/[-_]+/g, ' ')),
    category,
    description: deriveArticleDescription(input.content) || null,
    content: input.content,
    status: 'published',
    authorId: null,
    source: 'source',
    sourcePath: normalizedPath,
    publishedAt: input.updatedAt,
    archivedAt: null,
    deletedAt: null,
    updatedAt: input.updatedAt,
  }
}

export function filterArticlesByCategory<T extends WikiArticleRecord>(
  articles: T[],
  selectedCategory?: string | null,
) {
  const normalizedCategory = selectedCategory?.trim().replace(/^\/+|\/+$/g, '') ?? ''
  return [...articles]
    .filter((article) => {
      if (!normalizedCategory) return true
      return article.category === normalizedCategory || article.category.startsWith(`${normalizedCategory}/`)
    })
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
}

export function createSourceArticleId(relativePath: string) {
  return `source:${normalizeSourcePath(relativePath)}`
}

export function isSourceArticleId(articleId: string) {
  return articleId.startsWith('source:')
}

export function getSourceArticlePathFromId(articleId: string) {
  return isSourceArticleId(articleId) ? articleId.slice('source:'.length) : null
}

export function canPublishArticle(article: WikiArticleRecord, reviewerId: string | null | undefined, submittedById?: string | null) {
  if (resolveSource(article) === 'source') return false
  if (article.status !== 'review') return false
  if (!reviewerId) return false

  const ownerId = submittedById ?? article.authorId
  return reviewerId !== ownerId
}

function sortTree(nodes: WikiCategoryNode[]): WikiCategoryNode[] {
  return [...nodes]
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((node) => ({
      ...node,
      children: sortTree(node.children),
    }))
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}

function normalizeSourcePath(value: string) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '')
}

function resolveSource(article: WikiArticleRecord): WikiArticleSource {
  return article.source ?? 'database'
}
