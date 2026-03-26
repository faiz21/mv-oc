import { describe, expect, it } from 'vitest'
import {
  buildCategoryTree,
  buildSearchResults,
  buildSourceArticleRecord,
  canEditArticle,
  canPublishArticle,
  canReadArticle,
  createSourceArticleId,
  createSearchSnippet,
  deriveArticleDescription,
  filterArticlesByCategory,
  isSourceArticleId,
  normalizeCategoryLabel,
  paginateSearchResults,
  summarizeArticleStatus,
  type WikiArticleRecord,
} from './wiki-content'

const baseArticles: WikiArticleRecord[] = [
  {
    id: '1',
    title: 'Workflow Standards',
    category: 'agents/standards',
    description: 'Operating rules',
    content: 'Approval gates must be explicit and documented.',
    status: 'published',
    authorId: 'author-1',
    source: 'database',
    publishedAt: '2026-03-25T08:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    updatedAt: '2026-03-25T08:00:00.000Z',
  },
  {
    id: '2',
    title: 'Agent Builder Draft',
    category: 'agents/builders',
    description: null,
    content: 'This draft is visible to the author and admins only.',
    status: 'draft',
    authorId: 'author-2',
    source: 'database',
    publishedAt: null,
    archivedAt: null,
    deletedAt: null,
    updatedAt: '2026-03-25T09:00:00.000Z',
  },
]

describe('wiki content helpers', () => {
  it('builds a nested category tree with article counts', () => {
    const tree = buildCategoryTree(baseArticles)

    expect(tree).toEqual([
      {
        label: 'Agents',
        path: 'agents',
        articleCount: 2,
        children: [
          { label: 'Builders', path: 'agents/builders', articleCount: 1, children: [] },
          { label: 'Standards', path: 'agents/standards', articleCount: 1, children: [] },
        ],
      },
    ])
  })

  it('applies role-aware read and edit access using canonical role normalization', () => {
    expect(canReadArticle(baseArticles[0], { role: 'viewer', userId: 'member-1' })).toBe(true)
    expect(canReadArticle(baseArticles[1], { role: 'viewer', userId: 'member-1' })).toBe(false)
    expect(canReadArticle(baseArticles[1], { role: 'admin', userId: 'admin-1' })).toBe(true)
    expect(canEditArticle(baseArticles[1], { role: 'operator', userId: 'author-2' })).toBe(true)
    expect(canEditArticle(baseArticles[1], { role: 'viewer', userId: 'author-2' })).toBe(false)
  })

  it('creates search snippets and summary counts for the current list', () => {
    expect(createSearchSnippet(baseArticles[0], 'documented')).toContain('documented')
    expect(normalizeCategoryLabel('agents/standards')).toBe('Agents / Standards')
    expect(summarizeArticleStatus(baseArticles)).toEqual({
      published: 1,
      draft: 1,
      review: 0,
      archived: 0,
    })
  })

  it('keeps review articles hidden from members and directors, and blocks editing source articles', () => {
    const reviewArticle: WikiArticleRecord = {
      ...baseArticles[1],
      id: '3',
      status: 'review',
      source: 'database',
    }
    const sourceArticle: WikiArticleRecord = {
      ...baseArticles[0],
      id: createSourceArticleId('Guides/Onboarding/company-handbook.md'),
      status: 'published',
      source: 'source',
      sourcePath: 'Guides/Onboarding/company-handbook.md',
    }

    expect(canReadArticle(reviewArticle, { role: 'viewer', userId: 'member-1' })).toBe(false)
    expect(canReadArticle(reviewArticle, { role: 'director', userId: 'director-1' })).toBe(false)
    expect(canReadArticle(reviewArticle, { role: 'officer', userId: 'officer-1' })).toBe(true)
    expect(canEditArticle(sourceArticle, { role: 'admin', userId: 'admin-1' })).toBe(false)
    expect(isSourceArticleId(sourceArticle.id)).toBe(true)
  })

  it('derives descriptions, ranks search results, and prevents self-publish', () => {
    const results = buildSearchResults(
      [
        {
          ...baseArticles[0],
          id: '4',
          title: 'Password Management Guidelines',
          category: 'security/passwords',
          content: 'Passwords should be rotated and stored in the approved vault.',
          source: 'database',
        },
        {
          ...baseArticles[0],
          id: '5',
          title: 'Authentication Overview',
          category: 'security/authentication',
          content: 'Password resets require reviewer approval.',
          source: 'database',
        },
      ],
      'password',
    )

    expect(deriveArticleDescription('# Heading\n\nThis is the first useful paragraph.\n\n## Next')).toBe(
      'This is the first useful paragraph.',
    )
    expect(results[0]?.title).toBe('Password Management Guidelines')
    expect(results[0]?.snippet.toLowerCase()).toContain('password')
    expect(canPublishArticle({ ...baseArticles[1], status: 'review', source: 'database' }, 'author-2', 'author-2')).toBe(false)
    expect(canPublishArticle({ ...baseArticles[1], status: 'review', source: 'database' }, 'admin-1', 'author-2')).toBe(true)
  })

  it('creates source-backed article records from filesystem metadata', () => {
    const sourceArticle = buildSourceArticleRecord({
      relativePath: 'Guides/Onboarding/company-handbook.md',
      content: '# Company Handbook\n\nThis handbook introduces the onboarding process for new joiners.\n\n## Next Steps',
      updatedAt: '2026-03-26T06:00:00.000Z',
    })

    expect(sourceArticle).toMatchObject({
      id: 'source:Guides/Onboarding/company-handbook.md',
      title: 'Company Handbook',
      category: 'Guides/Onboarding',
      source: 'source',
      sourcePath: 'Guides/Onboarding/company-handbook.md',
      status: 'published',
    })
    expect(sourceArticle.description).toBe('This handbook introduces the onboarding process for new joiners.')
  })

  it('filters categories by prefix and paginates search results', () => {
    const articles: WikiArticleRecord[] = [
      {
        ...baseArticles[0],
        id: 'source:Guides/Onboarding/company-handbook.md',
        title: 'Company Handbook',
        category: 'Guides/Onboarding',
        content: 'Password basics and onboarding expectations.',
        source: 'source',
        sourcePath: 'Guides/Onboarding/company-handbook.md',
        updatedAt: '2026-03-26T06:00:00.000Z',
      },
      {
        ...baseArticles[0],
        id: 'source:Guides/Security/password-policy.md',
        title: 'Password Policy',
        category: 'Guides/Security',
        content: 'Password length and rotation requirements.',
        source: 'source',
        sourcePath: 'Guides/Security/password-policy.md',
        updatedAt: '2026-03-26T07:00:00.000Z',
      },
      {
        ...baseArticles[0],
        id: 'db-article-1',
        title: 'Workflow Overview',
        category: 'Operations/Workflow',
        content: 'Workflow overview for internal teams.',
        source: 'database',
        updatedAt: '2026-03-25T08:00:00.000Z',
      },
    ]

    expect(filterArticlesByCategory(articles, 'Guides').map((article) => article.id)).toEqual([
      'source:Guides/Security/password-policy.md',
      'source:Guides/Onboarding/company-handbook.md',
    ])

    const searchResults = buildSearchResults(articles, 'password')
    const page = paginateSearchResults(searchResults, 1, 1)

    expect(page.total).toBe(2)
    expect(page.totalPages).toBe(2)
    expect(page.items).toHaveLength(1)
    expect(page.items[0]?.title).toBe('Password Policy')
  })
})
