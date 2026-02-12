# Fixture Consolidation Loop

Goal: consolidate all fixtures under `packages/astro/test/fixtures` into a small set of mega fixtures (target < 10), while preserving all existing test assertions and functionality. No shortcuts, no moving fixtures into “legacy” buckets.

Rules:

1. Process fixtures strictly one at a time in alphabetical order.
2. Before each step, list fixtures with:
   `ls -1 packages/astro/test/fixtures | sort`
3. Pick the first fixture in the list that is NOT a mega fixture (mega-ssr, mega-static, mega-routing, mega-frameworks, mega-content) and migrate it.
4. For each fixture:
   - Decide the correct mega fixture based on behavior and config.
   - Move files into the mega fixture structure (preserve paths/behavior).
   - Update all tests referencing the old fixture root to the new location.
   - Remove the old fixture directory.
   - Keep all assertions intact.
5. Do not skip fixtures, do not batch or reorder.
6. If a fixture has no tests or references, delete it.
7. Stop only when the fixtures folder contains ONLY mega fixtures.

Completion:
Output exactly: <promise>RALPH_DONE</promise>
