---
name: merge
description: Handle main-to-next merge tasks including conflict resolution, changeset cleanup, and CI fix-ups. Use when merging main into next.
---

# Merge

Handle the main-to-next merge process. This skill has sub-skills for each stage:

- [resolve-conflicts.md](resolve-conflicts.md) — Resolve git merge conflicts
- [fix-ci.md](fix-ci.md) — Fix build errors, type errors, and test failures
- [clean-changesets.md](clean-changesets.md) — Remove stale changeset files

When invoked, check the `step` argument to determine which sub-skill to run, then read and follow that file's instructions.
