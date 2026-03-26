import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DocsBody, DocsDescription, DocsPage, DocsTitle, PageLastUpdate } from 'fumadocs-ui/page'
import type { TOCItemType } from 'fumadocs-core/toc'
import { normalizeCategoryLabel } from '@/features/wiki/wiki-content'

export function MarkdownArticle(props: {
  title: string
  description?: string | null
  category: string
  content: string
  updatedAt: string
  toc: TOCItemType[]
  meta?: React.ReactNode
}) {
  return (
    <DocsPage
      toc={props.toc}
      tableOfContent={{ enabled: true }}
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      className="rounded-[28px] border px-6 py-6"
      style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}
    >
      <div className="mb-5 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>
        <span>{normalizeCategoryLabel(props.category)}</span>
        {props.meta}
      </div>
      <DocsTitle>{props.title}</DocsTitle>
      <DocsDescription>{props.description ?? null}</DocsDescription>
      <PageLastUpdate date={new Date(props.updatedAt)} className="mt-4 text-sm" />
      <DocsBody className="mt-6 max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children, ...anchorProps }) => {
              const isExternal = Boolean(href && /^https?:\/\//i.test(href))

              return (
                <a
                  {...anchorProps}
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noreferrer noopener' : undefined}
                >
                  {children}
                </a>
              )
            },
            pre: ({ children }) => (
              <pre
                className="overflow-x-auto rounded-2xl p-4"
                style={{ background: 'var(--surface-container-low)' }}
              >
                {children}
              </pre>
            ),
          }}
        >
          {props.content}
        </ReactMarkdown>
      </DocsBody>
    </DocsPage>
  )
}
