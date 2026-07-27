---
name: astro-code-review
description: Perform a static, read-only code review of an Astro feature, bug fix, branch, commit, diff, or local working tree. Use this skill whenever the user asks to review local changes, review their current branch, self-review work before a pull request, or check a feature or fix for correctness, tests, simplicity, runtime portability, error handling, comments, behavior documentation, and changeset coverage. This skill reports findings only: it never edits code or runs project code, tests, builds, checks, or scripts.
---

# Astro Code Review

Review a proposed change for correctness and fit with the Astro codebase. Report actionable findings; do not implement fixes.

## Safety Boundary

This is a static review. Preserve the developer's working tree exactly as found.

- Do not create, edit, move, or delete files.
- Do not apply patches or create a changeset.
- Do not run project code, package-manager commands, scripts, tests, type checks, linters, formatters, builds, benchmarks, dev servers, or browsers.
- Do not delegate the review to another agent because these restrictions may not carry into the delegated task.
- Do not use GitHub APIs, `gh`, `curl`, or other network tools.
- Do not run mutating Git operations such as pull, merge, rebase, checkout, switch, reset, restore, clean, stash, commit, or push.

The only permitted network operation is one `git fetch origin main` before reviewing the default scope. Fetching updates Git metadata but not source files. If it fails, continue with the existing local `origin/main` and disclose that the comparison may be stale. Do not troubleshoot or retry the fetch.

Shell commands are limited to these read-only Git operations and the fetch exception:

- `git fetch origin main`
- `git status --short --branch`
- `git branch --show-current`
- `git rev-parse`
- `git merge-base HEAD origin/main`
- `git --no-pager diff --no-ext-diff --no-textconv ...`
- `git --no-pager show --no-ext-diff --no-textconv ...`
- `git --no-pager log ...`
- `git ls-files ...`

Use file-reading, globbing, and text-search tools for all other investigation. Do not use shell pipelines or scripts to analyze source code.

## Establish the Review Scope

Prefer an explicit scope supplied by the user, such as files, a diff, commits, or a base branch. Otherwise review the current branch and complete working tree against the latest available `origin/main`:

1. Run the permitted fetch once.
2. Find the merge base of `HEAD` and `origin/main`.
3. Inspect the diff from that merge base to the working tree. This includes committed, staged, and unstaged changes to tracked files.
4. Use Git status to identify untracked files, then read those files directly.

Do not fetch when the user provides a self-contained patch or asks for specific files only. If `origin/main` is unavailable or the intended base is ambiguous, ask for the base rather than guessing.

Establish the intended behavior from the user's description, commit messages, changed tests, and surrounding code. If correctness depends on requirements that are not available locally, state the assumption or ask for the missing context. A URL alone is not permission to fetch issue or pull-request data.

## Gather Context

Read enough surrounding code to understand the change rather than reviewing the diff in isolation:

- Read the complete changed functions and the relevant portions of their files.
- Inspect callers, importers, exports, and data flow affected by the change.
- Inspect existing tests and nearby test conventions.
- Search for equivalent logic, existing helpers, and analogous implementations before suggesting a new abstraction or reuse opportunity.
- Inspect comments changed by the diff and existing comments whose claims may have been invalidated by the new behavior.
- Read the root and nearest applicable `AGENTS.md` and `CONTRIBUTING.md` guidance.
- Consult package-specific documentation only when it governs the changed code.

Focus findings on the proposed change. Mention a pre-existing problem only when the change depends on it, worsens it, or makes it newly reachable.

## Review Method

Review in two passes:

1. **Design pass:** Understand the goal, decide whether the change belongs at the chosen architectural layer, and trace how its pieces interact with the rest of Astro.
2. **Implementation pass:** Review every human-written changed line and the relevant tests for correctness, failure behavior, and maintainability.

If part of the change cannot be understood from the available local context, ask for clarification or state the review limitation. Do not silently skip complex code.

Judge whether the change improves the codebase, not whether it is perfect. Distinguish defects that require action from optional improvements, and do not block useful work on personal preferences or unrelated cleanup.

## Review Priorities

Review in this order so correctness and compatibility are not displaced by style suggestions:

1. Design and architectural layer placement
2. Functional correctness and regressions
3. Runtime portability, state ownership, and generated output
4. Astro feature, API, and monorepo completeness
5. Error handling and failure behavior
6. Test coverage and test quality
7. Simplicity, duplication, and function boundaries
8. Comments and behavior documentation
9. Changeset coverage

### Design and Layer Placement

Check that the change solves the stated problem at the narrowest appropriate layer and integrates with existing architecture. In particular, distinguish build-time processing, Vite plugin implementation, generated virtual modules, shared application state, and per-request runtime behavior.

- Runtime code should receive build results through an explicit transport such as the manifest or a virtual module rather than import build implementation directly.
- New logic should use an existing subsystem boundary when one already owns the behavior.
- Unrelated behavior, refactors, or formatting should not be mixed into the change when they make review, rollback, or maintenance harder.
- A new feature should not introduce generic machinery or public surface area beyond its current requirements.

Consult [`astro-developer/architecture.md`](../astro-developer/architecture.md) when the change crosses build, development, rendering, or production boundaries.

### Functional Correctness

Trace actual inputs and outputs through the affected callers. Check that the implementation matches the intended contract in development, build, prerendering, and SSR contexts that can reach it.

Look for concrete problems involving:

- incorrect conditions, ordering, defaults, or state transitions
- empty, missing, malformed, duplicate, or boundary inputs
- asynchronous control flow, unawaited work, races, or cleanup
- mutation, caching, and lifecycle assumptions
- error and fallback behavior
- public API compatibility and changed observable behavior
- operating-system and runtime differences

Do not report a theoretical edge case without explaining how the changed code can encounter it and what fails.

### Runtime, State, and Generated Output

Astro-generated SSR code must run on non-Node runtimes such as Cloudflare Workers and Deno. Classify where code executes; do not infer safety only from the source file's location.

Inspect these boundaries carefully:

- Within `packages/astro/src`, files inside a `runtime/` directory and files named `*runtime*.ts` must not use Node.js APIs.
- Code emitted in a virtual module or generated source string is runtime code even when a Node-compatible Vite plugin creates it.
- A Vite plugin implementation may use Node.js APIs, but the virtual modules and values it emits must remain portable.
- `packages/astro/src/core/` contains mixed execution contexts. Trace whether changed code enters generated or production SSR output.
- For integrations and adapters, establish the declared target runtime before reporting Node.js usage. Node-specific adapter runtime code is allowed to depend on Node.js.
- Test-only Node.js usage is not a runtime leak.

Check both direct and transitive dependencies introduced by the change:

- `node:*` and bare Node built-in imports
- `process`, `Buffer`, `require`, `__dirname`, and other Node-specific globals
- imports and re-exports whose implementation depends on Node.js
- dependencies or package export paths that only work in Node.js
- generated code containing any of the above

Follow newly introduced import chains far enough to establish the execution boundary. The absence of a direct `node:*` import does not establish portability.

#### State Ownership and Pipeline Parity

Astro separates request state from state shared by the application or build:

- `RenderContext` and `FetchState` contain per-request data such as the request, URL, route, params, cookies, locals, and response state.
- `Environment` and `Pipeline` are created outside an individual request and may be reused across requests. Do not place request-specific mutable data on them.
- Shared caches need bounded ownership, correct invalidation, and concurrency-safe behavior. Consider repeated requests, rewrites, HMR, and multiple build environments.

When pipeline behavior changes, trace every applicable implementation: runnable development, non-runnable development, build/prerender, production SSR, and the Container API. Do not require irrelevant variants, but do not assume behavior exercised by one pipeline automatically reaches the others.

Use [`core/render/README.md`](../../../packages/astro/src/core/render/README.md) and [`astro-developer/architecture.md`](../astro-developer/architecture.md) to establish these boundaries.

#### Generated Output and Trust Boundaries

Treat values crossing into generated JavaScript, HTML, CSS, headers, manifests, and client bundles as trust-boundary crossings:

- Private environment variables and other server-only data must not enter client output.
- Values embedded in HTML, script, style, attribute, URL, or header contexts need context-appropriate validation, encoding, escaping, or serialization.
- Generated modules must preserve server/client separation and must not expose internal data through their exports.
- Serialized runtime data must contain only values that can be reconstructed correctly by the corresponding deserializer.
- User-controlled filesystem paths, remote URLs, redirects, headers, and log values must not enable traversal, unintended network access, injection, or secret disclosure.

Trace the origin and destination of changed values. Report an injection or data-leak risk only when a reachable input reaches an unsafe output context. Relevant sources include [`env/README.md`](../../../packages/astro/src/env/README.md), [`runtime/server/escape.ts`](../../../packages/astro/src/runtime/server/escape.ts), and the manifest serialization code.

Use these repository sources as the authoritative starting points:

- [`CONTRIBUTING.md`](../../../CONTRIBUTING.md), "Naming convention and APIs usage"
- [`biome.jsonc`](../../../biome.jsonc), the `noNodejsModules` runtime overrides
- [`astro-developer/constraints.md`](../astro-developer/constraints.md), "Node.js API Restrictions"

### Astro Feature, API, and Monorepo Completeness

Apply these checks only when the changed area makes them relevant. Search the surrounding subsystem rather than assuming this list is exhaustive.

#### Configuration and Runtime Transport

A new or changed Astro configuration option may need coordinated updates to:

- the hand-maintained public configuration type and its generated documentation
- defaults and the base, relative, and refined schemas
- integration update validation
- build settings and manifest serialization/deserialization
- every applicable development, build, prerender, and production consumer
- applicable runtime and compile-time type tests

Use [`core/config/schemas/README.md`](../../../packages/astro/src/core/config/schemas/README.md) to understand the three-schema model. If configuration must survive into production, trace it from user config through the serialized `SSRManifest` and back into the runtime environment.

#### Public Types and Package Exports

Types under `packages/astro/src/types/public/` are public API and follow semver. For public type or API changes, check backward compatibility, editor-facing documentation, and compile-time contract tests under `packages/astro/test/types/`.

When exports change:

- Public Astro exports belong in both `exports` and `publishConfig.exports`.
- Workspace-only internals belong under an explicit `./_internal/*` subpath and only in the monorepo export map.
- Other workspace packages should use declared subpaths instead of deep relative imports into another package.

Follow the "Public vs. internal API" section in [`CONTRIBUTING.md`](../../../CONTRIBUTING.md).

#### Dependencies and Project References

When package dependencies change:

- Dependencies on local workspace packages in packages, test fixtures, and examples should use `workspace:*`.
- External dependencies should use `catalog:` when the root catalog already owns the version.
- Runtime dependencies must be declared in the package that imports them and must be compatible with that package's execution environments.
- A package's TypeScript build references should mirror its workspace dependencies.
- A new package needs the standard build/test solution files and a reference from the root `tsconfig.json`.

Use the "TypeScript project references" section in [`CONTRIBUTING.md`](../../../CONTRIBUTING.md) and the package-boundary guidance in [`astro-developer/constraints.md`](../astro-developer/constraints.md).

#### Generated Files and Feature Registries

Identify generated files from their headers and repository scripts. Review the human-authored source of truth, confirm checked-in generated output corresponds to it when applicable, and do not treat minified or generated code as independently designed source. Never run the generator during this review.

When adding a feature, handler, enum member, or manifest field, search for parallel registration points such as serializers, deserializers, feature flags, warning checks, export maps, and tests. Prefer reading a subsystem README or a matching document under `reference/` over embedding a hard-coded inventory in the review. For example, changes to dependency optimization or fetch handlers should consult [`reference/optimize-deps.md`](../../../reference/optimize-deps.md) or [`reference/handlers.md`](../../../reference/handlers.md), respectively.

### Error Handling and Failure Behavior

Treat filesystem reads and writes, `JSON.parse()`, network access, serialization, and promises as fallible operations. Determine which layer owns recovery before deciding that a local `try/catch` is needed.

Good handling may take different forms:

- Recover locally from an expected failure with a safe, intentional fallback.
- Distinguish expected errors such as a missing optional file from corruption, permission failures, and other unexpected errors.
- Propagate the original error to an established caller or application boundary that can handle it.
- Wrap an error in the repository's domain error type with useful operation and path context while preserving its `cause`.
- Clean up resources or temporary state in `finally` when later operations can fail.

Report handling that can cause real harm, including:

- empty or broad catches that silently convert unexpected failures into success
- defaults that hide corrupt input, permission failures, or incomplete state
- lost error causes or messages that omit the failed operation or relevant path
- unawaited promises or rejected work that escapes the owning lifecycle
- continuing after a failed read, parse, or write with partial or invalid data
- writes that can expose partial state when the surrounding contract requires atomicity
- parse results trusted as a type without validation when the input crosses a trust boundary
- missing cleanup after a failed multi-step operation

Do not recommend `try/catch` solely because an operation can throw. Propagation is correct when the caller owns error presentation or recovery. Match established Astro error and logging patterns in nearby code rather than imposing a generic wrapper.

Check whether tests exercise meaningful failure paths, including malformed data and expected I/O failures, when those paths are part of the changed behavior.

When the change adds or modifies an Astro error contract, also check that:

- stable error names are not renamed or reused for a different condition
- the error uses established `AstroErrorData` patterns and preserves the underlying cause
- user-facing text explains what happened, why, and what action to take
- `@docs` metadata is present or updated when the error belongs in the generated reference

Use [`core/errors/README.md`](../../../packages/astro/src/core/errors/README.md) for Astro-specific error requirements.

### Test Coverage

Review test code statically; never run it.

- A bug fix should include a regression case that would fail without the fix.
- A feature should cover its observable behavior and meaningful branches, boundaries, and failure modes.
- Runtime-sensitive behavior may need coverage for relevant build, SSR, adapter, or platform contexts.
- Prefer testing public behavior. A focused direct test is useful when a self-contained function contains substantial branching or a domain invariant.
- Do not demand one test per function or tests for type-system guarantees.
- Verify that assertions would fail when the changed behavior regresses; tests are not sufficient merely because they execute the new lines.
- Prefer the smallest appropriate test layer. Use integration or end-to-end coverage only when the behavior cannot be established with a focused unit test.
- Unit tests belong in the package's `test/units/`, use `node:test` and `node:assert/strict`, import built `dist/` output, and should reuse existing test helpers.
- Public type contracts belong in the package's type-test suite.
- Integration fixtures must use isolated output directories and workspace dependencies so parallel tests cannot share generated state.

Every missing-test finding must name the untested scenario and the defect that the test would detect. Do not write generic findings such as "add more tests."

Use [`reference/unit-testing.md`](../../../reference/unit-testing.md) for test placement, imports, and available helpers. Confirm that a new test file is selected by the package's test scripts; a test that is never discovered provides no coverage.

### DRY, KISS, and Function Boundaries

DRY and KISS can conflict. Duplication is sometimes simpler than an abstraction that couples unrelated behavior.

Report a DRY opportunity when duplicated code represents the same domain rule or invariant, must evolve together, or reimplements an existing repository helper. Do not suggest abstraction for code that is merely syntactically similar.

Report a KISS opportunity when the change adds avoidable indirection, speculative configurability, generic machinery for one concrete case, premature caching or fast paths, or layers that obscure a straightforward data flow.

Evaluate extracted functions by the boundary they create, not only by call count:

- A single-use function can be justified when it names a domain operation, isolates a meaningful invariant, reduces cognitive load, or enables a focused test of non-trivial behavior.
- A single-use function is questionable when it only renames a trivial expression, requires jumping between files without hiding complexity, or is generalized for hypothetical reuse.
- Reuse alone does not justify a function, and one call site alone does not justify inlining it.

For performance-oriented code, look for evidence that the optimization is needed and verify that its complexity, invalidation, and fallback behavior remain correct. Flag premature optimization only when the simpler implementation meets the known requirement.

### Comments and Behavior Documentation

Apply the [`writing-comments` skill](../writing-comments/SKILL.md) to comments added or changed by the diff and to existing comments made false or incomplete by the changed behavior. Do not audit unrelated comments in the surrounding file.

Comments should be sparse and durable:

- Do not request a comment when names, types, and structure already explain the code.
- Inline comments should explain rationale, invariants, non-obvious coupling, or constraints rather than narrate the next statement.
- Workarounds, hacks, regression guards, and surprising dependency behavior should link to the issue or pull request that explains why they exist.
- Comments must describe the code at HEAD, not the change history, review discussion, or why the patch is correct.
- A changed behavior must not leave an existing comment stale. A false comment is worse than a missing one.

When a function or public API needs behavior documentation, check that it is written for its human caller rather than as a translation of the implementation:

- Start with what the function accomplishes or returns.
- Document surprising caller-visible behavior such as fallbacks, limits, overload selection, side effects, ambiguous results, and conditions that return `undefined`, `null`, an empty value, or another indeterminate result.
- Describe implementation details only when callers need them to use the API safely.
- Add a minimal example only when a relationship cannot be understood from the signature, such as overload selection, optional or rest argument mapping, a public re-export, or ambiguous fallback behavior. Introduce what the example demonstrates and its expected result.
- Module documentation should explain a durable concept or architectural reason, not maintain a list of exports that will become stale.

For `@docs` entries and public types, preserve the audience rules in the `writing-comments` skill: generated config and error references are end-user documentation, and other public JSDoc is surfaced through editor IntelliSense.

Keep comment findings non-invasive. Report inaccurate or misleading documentation as a finding when it can lead callers or maintainers to incorrect behavior. Put a missing explanation under suggestions unless an undocumented contract, invariant, or public caveat creates a concrete correctness or compatibility risk.

### Changeset Coverage

Follow the current repository policy in [`CONTRIBUTING.md`](../../../CONTRIBUTING.md) and the [`changeset` skill](../changeset/SKILL.md): every pull request that modifies a package under `packages/` requires a pending changeset. Changes outside packages, including `examples/`, do not require one by themselves.

- Check for a newly added `.changeset/*.md` file in the review scope. Configuration, README, and prerelease metadata files are not pending changesets.
- If packages changed, confirm the changeset frontmatter covers the affected package names.
- Report a missing or ineffective changeset as a finding.
- Do not invoke the changeset skill or create or edit a changeset.

## Finding Threshold

Report only issues that are actionable and supported by the inspected code.

- Explain the input, call path, runtime, or maintenance condition that triggers the problem.
- Explain the resulting incorrect behavior or concrete long-term cost.
- Point to the smallest relevant changed line or range.
- Give a minimal remediation direction without writing the patch.
- Put uncertain requirements or design choices under questions, not findings.
- Avoid formatter, naming, and stylistic comments unless they violate an explicit repository standard and materially reduce correctness or maintainability.
- Consolidate repeated symptoms with the same root cause into one finding and list the affected locations instead of repeating the comment.
- Keep optional improvements separate from required findings. Do not use severity to make a personal preference appear mandatory.

## Report Format

Put findings first and order them by severity. Do not lead with a summary or praise.

```md
## Findings

- [high] `path/to/file.ts:42` - Short title. Explain the triggering scenario, impact, and minimal remediation direction.
- [medium] `path/to/file.ts:87` - Short title. Explain the triggering scenario, impact, and minimal remediation direction.

## Questions

- Include only unresolved assumptions that affect correctness. Omit this section when there are none.

## Suggestions

- [optional] `path/to/file.ts:110` - Include only non-blocking improvements with a concrete benefit. Omit this section when there are none.

## Review Status

Scope: `<base>` through the current working tree, plus listed untracked files.
Changeset: present and covers `<packages>` | missing for `<packages>` | not required.
Validation: Static review only; no project code, tests, builds, or checks were run.
Fetch: updated `origin/main` | fetch failed and local `origin/main` was used | not needed for the supplied scope.
```

Use `high` for likely runtime breakage, data loss, broad regressions, or incompatible behavior; `medium` for credible edge-case failures, missing required failure handling, and material test gaps; and `low` for concrete maintainability or process issues that should be addressed. Use `optional` only for improvements that are not required for correctness or code health. Severity reflects impact, not confidence.

If there are no findings, write `No findings.` under `## Findings`. Still include review status and mention any residual uncertainty caused by unavailable requirements or context.
