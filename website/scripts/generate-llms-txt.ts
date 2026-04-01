import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = path.resolve(__dirname, '../src/content/docs')
const SITE_URL = 'https://paretojs.tech'

interface DocFile {
  title: string
  description: string
  slug: string
  category: string
  content: string
}

function parseFrontmatter(raw: string): {
  title: string
  description: string
  body: string
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { title: '', description: '', body: raw }

  const frontmatter = match[1]
  const body = match[2]

  const title = frontmatter.match(/title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? ''
  const description =
    frontmatter.match(/description:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? ''

  return { title, description, body: body.trim() }
}

/** Strip markdown links: [text](url) → text */
function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

/** Remove trailing "See ... for ..." references */
function stripSeeReferences(text: string): string {
  return text.replace(/\s*See\s+.+\s+for\s+.+\.?$/, '.').replace(/\.\.$/, '.')
}

function extractKeyAPIs(body: string): string[] {
  const apis: string[] = []
  const lines = body.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^###\s+`(.+?)`/)
    if (headingMatch) {
      for (let j = i + 1; j < lines.length && j <= i + 3; j++) {
        const desc = lines[j].trim()
        if (
          desc &&
          !desc.startsWith('```') &&
          !desc.startsWith('#') &&
          !desc.startsWith('|')
        ) {
          const cleaned = stripSeeReferences(stripMarkdownLinks(desc))
          apis.push(`- \`${headingMatch[1]}\` — ${cleaned}`)
          break
        }
      }
    }
  }

  return apis
}

function extractFileConventions(body: string): string[] {
  const conventions: string[] = []
  const lines = body.split('\n')

  for (const line of lines) {
    const tableMatch = line.match(/^\|\s*`([^`]+)`\s*\|\s*(.+?)\s*\|/)
    if (tableMatch && !tableMatch[1].includes('---')) {
      const cleaned = stripMarkdownLinks(tableMatch[2].trim())
      conventions.push(`- \`${tableMatch[1]}\` — ${cleaned}`)
    }
  }

  return conventions
}

function scanDocs(): DocFile[] {
  const categories = ['guides', 'concepts', 'api']
  const docs: DocFile[] = []

  for (const category of categories) {
    const dir = path.join(DOCS_DIR, category)
    if (!fs.existsSync(dir)) continue

    const files = fs
      .readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .sort()

    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
      const { title, description, body } = parseFrontmatter(raw)
      const slug = file.replace(/\.md$/, '')

      docs.push({ title, description, slug, category, content: body })
    }
  }

  return docs
}

function generateLlmsTxt(docs: DocFile[]): string {
  const introDoc = docs.find(
    d => d.slug === 'introduction' && d.category === 'guides',
  )
  const coreDoc = docs.find(d => d.slug === 'core' && d.category === 'api')
  const routingDoc = docs.find(
    d => d.slug === 'routing' && d.category === 'concepts',
  )

  // Extract key APIs from core doc (skip Types section)
  const keyAPIs = coreDoc
    ? extractKeyAPIs(coreDoc.content.split('\n## Types')[0])
    : []
  // Extract file conventions from routing doc
  const fileConventions = routingDoc
    ? extractFileConventions(routingDoc.content)
    : []

  // Extract the first paragraph from introduction as overview
  const introFirstParagraph = introDoc
    ? introDoc.content.split('\n\n')[0].replace(/\n/g, ' ').trim()
    : ''

  const lines: string[] = [
    '# Pareto',
    '',
    `> ${introDoc?.description ?? 'Lightweight React SSR framework.'}`,
    '',
  ]

  if (introFirstParagraph) {
    lines.push(introFirstParagraph, '')
  }

  // Key APIs
  if (keyAPIs.length > 0) {
    lines.push('## Key APIs', '')
    lines.push(...keyAPIs)
    lines.push('')
  }

  // File conventions
  if (fileConventions.length > 0) {
    lines.push('## File Conventions', '')
    lines.push(...fileConventions)
    lines.push('')
  }

  // Documentation pages grouped by category
  lines.push('## Documentation', '')

  const categoryLabels: Record<string, string> = {
    guides: 'Guides',
    concepts: 'Concepts',
    api: 'API Reference',
  }

  for (const category of ['guides', 'concepts', 'api']) {
    const categoryDocs = docs.filter(d => d.category === category)
    if (categoryDocs.length === 0) continue

    lines.push(`### ${categoryLabels[category]}`, '')
    for (const doc of categoryDocs) {
      const url = `${SITE_URL}/${category}/${doc.slug}/`
      lines.push(`- [${doc.title}](${url}): ${doc.description}`)
    }
    lines.push('')
  }

  // Links
  lines.push(
    '## Links',
    '',
    `- Documentation: ${SITE_URL}`,
    '- GitHub: https://github.com/childrentime/pareto',
    '- npm: https://www.npmjs.com/package/@paretojs/core',
    '',
  )

  return lines.join('\n')
}

// Main
const docs = scanDocs()
const content = generateLlmsTxt(docs)

const publicDir = path.resolve(__dirname, '../public')
const wellKnownDir = path.join(publicDir, '.well-known')

fs.mkdirSync(wellKnownDir, { recursive: true })
fs.writeFileSync(path.join(publicDir, 'llms.txt'), content)
fs.writeFileSync(path.join(wellKnownDir, 'llms.txt'), content)

console.log(`Generated llms.txt (${docs.length} docs)`)
