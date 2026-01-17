# @astrojs/skills

Load and serve [Agent Skills](https://agentskills.io/) from your Astro site via well-known URIs.

This integration implements the [Agent Skills Discovery RFC](https://github.com/elithrar/agent-skills-discovery-rfc), allowing AI agents to discover and use skills published on your website.

## Installation

```bash
npx astro add skills
```

Or install manually:

```bash
npm install @astrojs/skills
```

## Setup

### 1. Add the integration to your Astro config

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config';
import skills from '@astrojs/skills';

export default defineConfig({
  integrations: [skills()],
});
```

### 2. Configure the content collection

Create or update your `src/content.config.ts` file:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { skillsLoader } from '@astrojs/skills';

export const collections = {
  skills: defineCollection({
    loader: skillsLoader({ base: './skills' }),
  }),
};
```

### 3. Create your skills directory

Create a `skills/` directory in your project root with your skills:

```
skills/
└── pdf-processing/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    │   └── extract.py
    ├── references/        # Optional: documentation
    │   └── REFERENCE.md
    └── assets/            # Optional: templates, data files
        └── schema.json
```

## Skill Structure

Each skill must have a `SKILL.md` file with YAML frontmatter containing `name` and `description` fields:

```markdown
---
name: pdf-processing
description: Extract text and tables from PDF files. Use when working with PDFs or document extraction.
---

# PDF Processing

## Quick Start

Use pdfplumber to extract text:

\`\`\`python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
text = pdf.pages[0].extract_text()
\`\`\`

## Form Filling

For filling PDF forms, see [references/FORMS.md](references/FORMS.md).
```

### Skill Name Requirements

Skill names (directory names) must follow the Agent Skills specification:

- 1-64 characters
- Lowercase alphanumeric and hyphens only (`a-z`, `0-9`, `-`)
- Cannot start or end with a hyphen
- Cannot contain consecutive hyphens

## Generated Routes

The integration automatically generates the following routes:

| Route                                   | Description                        |
| --------------------------------------- | ---------------------------------- |
| `/.well-known/skills/index.json`        | JSON index of all available skills |
| `/.well-known/skills/[skill]/SKILL.md`  | Skill instructions (default)       |
| `/.well-known/skills/[skill]/[...path]` | Any file within a skill directory  |

### Example Response: `index.json`

```json
{
  "skills": [
    {
      "name": "pdf-processing",
      "description": "Extract text and tables from PDF files. Use when working with PDFs or document extraction."
    },
    {
      "name": "code-review",
      "description": "Review code for bugs, security issues, and best practices."
    }
  ]
}
```

## Accessing Skills in Astro

You can also access skills programmatically in your Astro pages:

```astro
---
import { getCollection, getEntry } from 'astro:content';

// Get all skills
const allSkills = await getCollection('skills');

// Get a specific skill
const pdfSkill = await getEntry('skills', 'pdf-processing');

// Access skill data
const { name, description, files } = pdfSkill.data;

// Render the SKILL.md content
const { Content } = await pdfSkill.render();
---

<h1>{name}</h1>
<p>{description}</p>
<Content />
```

## Configuration Options

### Integration Options

```ts
skills({
  // Currently no options - reserved for future use
});
```

### Loader Options

```ts
skillsLoader({
  // Base directory for skills, relative to project root
  // Default: 'skills/'
  base: './skills',
});
```

## Progressive Loading

The integration follows the Agent Skills progressive loading pattern:

1. **Level 1 (Index)**: Agents fetch `index.json` to discover available skills (~100 tokens per skill)
2. **Level 2 (Instructions)**: When activated, agents fetch `SKILL.md` for full instructions
3. **Level 3 (Resources)**: Agents fetch additional files (scripts, references) on demand

This means you can include extensive reference material without impacting initial load times.

## File Handling

- **Text files** (`.md`, `.py`, `.json`, etc.) are stored as UTF-8 strings
- **Binary files** (`.png`, `.pdf`, `.zip`, etc.) are base64-encoded and served with correct MIME types

## Learn More

- [Agent Skills Specification](https://agentskills.io/specification)
- [Agent Skills Discovery RFC](https://github.com/elithrar/agent-skills-discovery-rfc)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
