---
'create-astro': minor
---

Adds support for marking sections in template READMEs to be removed when the `create astro` command is used to create a new project

Theme authors can now use magic comments in template READMEs to mark sections that should not be included when a user runs `create-astro` with the `--template` flag to create a new project.

This allows templates to have content that is visible when viewed in the source repo but not when the template is copied for use in a new project. This is useful for content that is appropriate for a theme's own repository, but will not be useful to someone using the theme, such as 
an "Open this repository in StackBlitz" badge where the URL is hardcoded .

Use the magic comments `<!-- ASTRO:REMOVE:START -->` and `<!-- ASTRO:REMOVE:END -->` to indicate content to be excluded from your README during the `create astro` process.

```md
<!-- ASTRO:REMOVE:START -->

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)

<!-- ASTRO:REMOVE:END -->
```

Note that these comments only remove content when new projects are created using `create astro`. When your theme template is forked, your README will be copied in its entirety.
