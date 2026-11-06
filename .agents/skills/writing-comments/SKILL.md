---
name: writing-comments
description: How to write JSDoc (/** */) and inline (//) comments in the Astro codebase, for contributors reading the source — not end users. Use whenever writing or editing comments in .ts/.js source, including comments added incidentally while fixing bugs or building features. Does not cover the @docs-generated config/error reference.
---

# Writing Comments

## Purpose

Comments in this repository are read by contributors, months or years after
they were written, with none of the context you have right now. This skill
defines who that reader is, what each kind of comment is for, and which patterns
are banned.

## Scope Boundary

This skill governs **contributor-facing** comments in the TypeScript/JavaScript
source. It does **not** apply to end-user documentation:

- JSDoc blocks tagged `@docs` in
  [`packages/astro/src/types/public/config.ts`](../../../packages/astro/src/types/public/config.ts)
  and
  [`packages/astro/src/core/errors/errors-data.ts`](../../../packages/astro/src/core/errors/errors-data.ts)
  are scraped by an external `docgen` tool and published to the Astro docs
  website. Follow
  [`packages/astro/src/core/errors/README.md`](../../../packages/astro/src/core/errors/README.md)
  for those, and get docs-team review — CI regenerates the reference when
  `types/public/**` changes.
- Other JSDoc across `types/public/**` is surfaced to users through editor
  IntelliSense. Write it for Astro **users** building a site, not for
  contributors reading the source.

Everything below is about the source a contributor reads at HEAD.

## The Reader

Write for an Astro contributor who is competent in TypeScript but has **no
access to your current context**: not this conversation, not the pull request,
not the issue, not the diff. They see only the repository at HEAD.

Two consequences follow directly:

1. **Never narrate change history.** Words like "now", "previously", "no
   longer", "the new approach" are meaningless at HEAD, where only one approach
   exists. State how the code works, not how it came to be. (A `@deprecated`
   notice is the exception — see [Conventions](#conventions-in-this-codebase) —
   because it describes the contract's future, which the reader needs.)
2. **Never address the reviewer.** A comment that argues your change is correct
   ("this properly handles X") belongs in the PR description, not in the source.
   The comment must justify the code as it stands, permanently.

## Three Kinds of Comments, Three Different Jobs

| Kind                   | Syntax                                | Job         | Contains                                                                                          |
| ---------------------- | ------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| File / module overview | `/** */` at the top of the file       | Explanation | Why the module exists, the concepts and terms it defines, how the pieces relate, design rationale |
| Item docs              | `/** */` directly above a declaration | Reference   | The contract: behavior, parameters, return value, thrown errors, invariants. Neutral and factual  |
| Inline comments        | `//` inside a body                    | Rationale   | Only what the code cannot say: constraints, workarounds (with issue links), non-obvious coupling  |

Do not mix the jobs. Implementation details do not belong in the `/** */`
contract — put them as `//` comments inside the body. The contract does not
belong scattered across inline comments — put it on the declaration.

## Behavior Documentation

When item documentation is warranted, write the contract for a human reader,
not as a translation of the implementation. This does not require JSDoc for
every function; names, types, and structure should carry straightforward
behavior on their own.

- Start with a plain-language description of what the function returns or
  accomplishes.
- Use short or medium-length sentences with one main idea each.
- Avoid internal Astro jargon when callers do not need it. If a technical term
  is necessary, explain it in the same paragraph.
- Describe caller-visible caveats that can be surprising: fallback behavior,
  work limits, ambiguous results, overload ordering, side effects, and the
  conditions that return `undefined`, `null`, an empty result, or another
  indeterminate value.
- Document thrown errors when callers are expected to distinguish or recover
  from them.
- Do not describe implementation details unless callers need them to understand
  the behavior or use the API safely.

Add an example when behavior depends on a relationship the signature cannot
show clearly. Common Astro and TypeScript cases include:

- which overload is selected;
- how arguments map to optional or rest parameters;
- which public Astro entrypoint exposes a symbol that is implemented or
  re-exported elsewhere;
- fallback behavior for ambiguous routes, incomplete configuration, or missing
  content;
- a result whose meaning is not obvious from its type.

Introduce the example in prose before the code block. State what it demonstrates
and what result is expected. Keep snippets minimal, self-contained, and written
from the perspective of an Astro user or the internal caller that owns the
contract.

Module documentation should describe a durable concept, architectural boundary,
or design reason. Do not list individual exports merely to summarize the file;
such inventories become stale as symbols are added or renamed. If a module has
no durable concept to explain, use a brief one-line description or no overview.

## The Deletion Test

Before writing any comment, ask: **does this state something the reader cannot
recover from the code itself?**

- If the information is already carried by names, types, or structure, do not
  write the comment. If the name fails to carry it, improve the name.
- Information that legitimately needs a comment: an invariant, a rationale, a
  coupling to code elsewhere, a workaround with a link, surprising behavior of a
  dependency, a term of art the module defines.

When editing later, the same test applies in reverse: a comment that no longer
passes it should be deleted, not left to rot.

## Link to the Issue for Workarounds

This codebase consistently anchors workarounds to a source. Any comment that
explains a workaround, a `HACK`, a regression guard, or surprising behavior of a
dependency **must link the GitHub issue or PR** that motivates it. The link is
what lets a future reader tell whether the workaround is still needed.

```ts
// Handle recommended nanostores. Only @nanostores/preact is required from our testing!
// Full explanation and related bug report: https://github.com/withastro/astro/pull/3667
'@nanostores/preact',
```

A workaround with no link is indistinguishable from a mistake.

## Banned Patterns

**Narrating the next line.** Delete these on sight:

```ts
// Increment the generation counter
generation += 1;
```

**Change-history narration.** Rewrite as present-tense rationale:

```ts
// BAD: We now resolve lightningcss from the user's root instead of ours.
// GOOD: lightningcss is an optional peer dep, so it resolves from the user's project root.
```

**Reviewer-addressed justification.** Move the argument to the PR:

```ts
// BAD: This correctly handles the multi-encoded path from the bug report.
// GOOD: A path still encoded after MAX_DECODE_ITERATIONS is rejected, so
//       middleware and routing can never disagree on the decoded path.
```

**Restated JSDoc.** A `/** */` block that rewords the declaration name says nothing:

```ts
// BAD:
/** Compiles the styles. */
function compileStyles(...)

// GOOD:
/** Rewrites relative `url()` references in `css` against `base`, leaving
 *  absolute and data URLs untouched. */
function compileStyles(...)
```

**Vague hedging.** "Some cases", "various reasons", "handles edge cases",
"etc." — either name them or drop the sentence.

**Emojis.** Banned in source, comments included (repo-wide policy).

**Ad-hoc section banners** (`// ----- helpers -----`, `// ==== TYPES ====`).
This codebase has no `// #region` folding convention; do not add banners. If a
file is long enough that you reach for one, that is a signal to split the file,
not to decorate it.

## Conventions in This Codebase

**JSDoc tags.** `@param name - description`, `@returns`, and `@throws` state the
contract. Brace-wrap a type (`@returns {Promise<string>}`) only when the
signature alone is ambiguous. Use `@example` with a fenced ` ```js ` block for
non-obvious usage.

**Cross-references.** Use `{@link Symbol}` / `{@linkcode Symbol}` rather than a
bare name, so a rename updates the reference and editors can jump to the target.

**`@internal`.** Marks API that is not part of the public surface. It is a
convention only — there is no typedoc or api-extractor here to strip it — so it
documents intent but does not replace access modifiers.

**`@deprecated`.** State the migration, then the removal horizon:

```ts
/** @deprecated Use the instance method `cookies.consume()` instead. This will be removed in Astro 7 */
```

Say what to use instead, not merely that the symbol is deprecated. This
future-tense note is contract information the reader needs, not banned
change-history narration.

**TODO.** Use `// TODO:` for deferred work; link an issue when one tracks it.
For work gated on a breaking-change window, use the established idiom
`// TODO: remove in Astro <N>`. There is no `FIXME` in this codebase — do not
introduce it.

## Editing Existing Code

- Preserve existing comments. If your change alters behavior, extend or correct
  the specific prose — never replace it with generic text. Deleting hard-won
  context is worse than leaving a comment slightly stale.
- When your change makes a comment false, fix it in the same diff. A stale
  comment is worse than none.
- Match the surrounding density. A heavily documented module deserves the same
  level on new items; do not blanket a sparse module with comments.

## Self-Check Before Finishing

After completing any task that touched comments, re-read **only the comments in
your diff**, in isolation from the code changes:

1. Does each one pass the deletion test?
2. Does any reference the conversation, the change itself, or the reviewer?
3. Does every workaround link its issue or PR?
4. Would a reader without access to the diff understand each one?

Fix or delete what fails. Deletion is the default; a missing comment is cheaper
than a misleading one.

## References

- [Diátaxis](https://diataxis.fr/) — the framework behind the explanation /
  reference / rationale split above.
- [`packages/astro/src/core/errors/README.md`](../../../packages/astro/src/core/errors/README.md)
  — for `@docs`-tagged error entries, which are end-user documentation.
- [TSDoc](https://tsdoc.org/) — the tag reference for TypeScript doc comments.
