# Fix Phase

This document guides you through investigating and fixing a reproduced bug.

## Prerequisites

- You have successfully reproduced the issue (see [TRIAGE.md](TRIAGE.md))
- You understand what the bug is and when it occurs

## Step 1: Locate the Relevant Code

The Astro source code is organized as:

```
packages/
├── astro/                    # Core Astro package
│   └── src/
├── integrations/
│   ├── cloudflare/          # @astrojs/cloudflare
│   ├── node/                # @astrojs/node
│   ├── vercel/              # @astrojs/vercel
│   ├── netlify/             # @astrojs/netlify
│   └── ...                  # Other integrations
└── ...
```

Use the error stack trace to identify which files are involved. The compiled code in `node_modules/` corresponds to source files in `packages/`.

## Step 2: Investigate in node_modules

Start by investigating the compiled code in your reproduction project:

```bash
# Find relevant files
ls -la repro-issue/node_modules/astro/dist/
ls -la repro-issue/node_modules/@astrojs/<adapter>/dist/
```

Add console.log statements, modify code, and re-run to understand:
- What code path is being executed?
- What values are being passed?
- Where does the logic go wrong?

## Step 3: Identify the Root Cause

Document your findings:
- Which file(s) contain the bug?
- What is the code doing wrong?
- Why does this cause the observed behavior?

## Step 4: Develop a Fix

Modify the code in `node_modules/` to fix the issue:

1. Make the minimal change needed to fix the bug
2. Avoid introducing new features or unrelated changes
3. Consider edge cases and backward compatibility

Test your fix:

```bash
cd repro-issue
npm run build  # or dev/preview as appropriate
```

Verify:
- The original bug no longer occurs
- No new errors are introduced
- The expected behavior now works

## Step 5: Generate the node_modules Patch

Create a patch that users can apply via `patch-package`:

1. Get the original file:
   ```bash
   npm pack <package>@<version> --pack-destination /tmp
   tar -xzf /tmp/<package>-<version>.tgz -C /tmp
   ```

2. Generate a diff:
   ```bash
   diff -u /tmp/package/dist/<file>.js repro-issue/node_modules/<package>/dist/<file>.js
   ```

Save this diff for the report.

## Step 6: Apply Fix to Source Repository

Now apply your fix to the actual TypeScript source:

1. Find the corresponding source file in `packages/`:
   ```bash
   # Example: if you modified node_modules/@astrojs/cloudflare/dist/index.js
   # The source is at packages/integrations/cloudflare/src/index.ts
   ```

2. Apply the equivalent fix to the TypeScript source

3. Generate a git diff:
   ```bash
   git diff packages/
   ```

Save this diff for the report.

## Step 7: Verify Source Fix (Optional)

If time permits, you can build the package from source to verify:

```bash
cd packages/integrations/<package>
pnpm install  # Astro uses pnpm for development
pnpm build
```

## Next Steps

Proceed to [REPORT.md](REPORT.md) to generate the final report with your findings and patches.

## Tips

- **Keep changes minimal**: Fix only what's broken, don't refactor
- **Match existing code style**: Follow the patterns in the surrounding code
- **Consider alternatives**: Note other approaches you considered and why you chose your solution
- **Test thoroughly**: Try edge cases and related scenarios
