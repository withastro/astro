---
'astro': minor
---

Adds `ActionInputError` to `astro:actions` so you can report validation failures from an action handler

Throw `new ActionInputError(issues)` with the issues from your validator. The caller can use `isInputError(error)` to read `error.issues` or display messages from `error.fields` by top-level field name. Issues without a field path appear only in `error.issues`.
