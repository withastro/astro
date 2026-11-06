---
name: changeset
description: Create a changeset for the Astro monorepo. Use this skill whenever you need to add a changeset file to a PR, write a changelog entry, or document a package version bump. Also trigger when the user says "add a changeset", "write a changeset", "create a changeset", or when another skill instructs you to create a changeset.
---

# Changeset

Create changeset files for the Astro monorepo. Changesets declare which packages changed, the semver bump type, and a user-facing message that becomes the CHANGELOG entry.

Every PR that modifies a package requires a changeset. Only `examples/*` changes are exempt.

## Creating the File

Run `pnpm changeset --empty` from the repo root. This creates a randomly-named `.md` file in `.changeset/` with empty front matter — no need to invent a filename or inspect the directory. Then edit the generated file to add the package bump and message.

## Format

```md
---
'<package-name>': patch
---

<changeset message>
```

- Package names must match the `name` field in the package's `package.json` exactly (e.g., `'astro'`, `'@astrojs/node'`)
- Bump types: `patch`, `minor`, or `major`
- A single changeset file can cover multiple packages
- `major` and `minor` bumps to the core `astro` package are blocked by CI and require maintainer review

## Writing the Message

The changeset message is a public CHANGELOG entry. Write it for **Astro users**, not for code reviewers.

Begin with a **present tense verb** that completes the sentence "This PR ...":

- Adds, Removes, Fixes, Updates, Refactors, Improves, Deprecates

Describe the change **as someone building an Astro site will experience it**, not how it was implemented internally:

```md
// Too implementation-focused
Logs helpful errors if content is invalid

// Better -- user-facing impact
Adds logging for content collections configuration errors.
```

### Patch updates

One line is usually enough. No end punctuation required unless writing multiple sentences.

```md
---
'astro': patch
---

Fixes a bug where the toolbar audit would incorrectly flag images as above the fold
```

```md
---
'astro': patch
---

Refactors internal handling of styles and scripts for content collections to improve build performance
```

Help the reader figure out if the change matters to them. Include the specific API name (with backtick formatting) when the change is tied to a recognizable option or function. When the API is not user-facing, describe the use case or end result instead:

```md
// Vague
Improves automatic fallbacks generation

// Clear -- reader can tell if it affects them
Improves automatic `fallbacks` generation for the experimental Fonts API
```

### New features (minor)

Start with "Adds", name the new API, and describe what users can now do. Include a code example when helpful:

````md
---
'astro': minor
---

Adds a new, optional property `timeout` for the `client:idle` directive

This value allows you to specify a maximum time to wait, in milliseconds, before hydrating a UI framework component.

```astro
<Button client:idle={{ timeout: 500 }} />
```
````

New features are an opportunity to write a richer description that can feed into blog posts. See the [Astro changeset docs](https://contribute.docs.astro.build/docs-for-code-changes/changesets/#new-features) for guidance on longer entries.

### Breaking changes (major)

Use verbs like "Removes", "Changes", or "Deprecates". Must include migration guidance. Use diff code samples when appropriate:

````md
---
'astro': major
---

Removes support for Shiki custom language's `path` property. The language JSON file must now be imported and passed to the option instead.

```diff
// astro.config.js
+ import customLang from './custom.tmLanguage.json'

export default defineConfig({
  markdown: {
    shikiConfig: {
      langs: [
-       { path: './custom.tmLanguage.json' },
+       customLang,
      ],
    },
  },
})
```
````

Changes to default values must mention the old default, the new default, and how to restore previous behavior.

### Longer changesets

For longer descriptions, use `####` and deeper headings (never `##` or `###`) to divide sections. This keeps the CHANGELOG readable when your entry is incorporated:

```md
---
'astro': minor
---

Adds a new Sessions API to store user state between requests for on-demand rendered pages.

#### Configuring session storage

<!-- ... -->

#### Using sessions

<!-- ... -->
```
