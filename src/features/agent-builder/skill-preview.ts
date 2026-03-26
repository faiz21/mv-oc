export function renderSkillMarkdown(input: {
  name: string
  description: string
  dispatchMode: string
  instructionMarkdown: string
  inputSchema: unknown
  outputSchema: unknown
  validationRules: unknown
}) {
  return `---
name: ${input.name}
description: ${input.description}
---

## Dispatch Mode

\`${input.dispatchMode}\`

## Instructions

${input.instructionMarkdown}

## Input Schema

\`\`\`json
${JSON.stringify(input.inputSchema, null, 2)}
\`\`\`

## Output Schema

\`\`\`json
${JSON.stringify(input.outputSchema, null, 2)}
\`\`\`

## Validation Rules

\`\`\`json
${JSON.stringify(input.validationRules, null, 2)}
\`\`\`
`
}
