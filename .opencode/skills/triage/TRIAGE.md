# Triage Phase

This document guides you through fetching a GitHub issue and attempting to reproduce it.

## Step 1: Fetch the Issue

Use the `gh` CLI to fetch the complete issue details including all comments:

```bash
gh issue view <issue_number> --repo withastro/astro --comments
```

Read the entire issue carefully, including:
- The original bug report
- Any reproduction steps provided
- Environment details (Astro version, adapter, etc.)
- All comments and discussion

## Step 2: Analyze the Issue

Before attempting reproduction, determine:

1. **Astro Version**: Which major version is affected?
   - Astro 6 (beta/next): Use `--ref next` with `npm create astro`
   - Astro 5 (current stable): Do not use `--ref next`
   - Astro 4 or earlier: **Not supported** - inform the user and exit

2. **Runtime/Package Manager**: Is the issue specific to a non-Node runtime or non-npm package manager?
   - If specific to Bun, Deno, yarn, or pnpm: **Not supported** - inform the user and exit

3. **Reproduction Requirements**: What's needed to reproduce?
   - Which packages/adapters are involved?
   - What configuration is required?
   - What user code triggers the bug?

## Step 3: Set Up Reproduction Environment

Use `npm create astro@latest` to create a new, minimal test project in the astro repo. We'll use this directory as our reproduction environment.

```bash
# For Astro 6 (beta)
npm create astro@latest -- --ref next --template minimal --no-git --no-install -y triage/gh-<issue_number>

# For Astro 5 (stable)
npm create astro@latest -- --template minimal --no-git --no-install -y triage/gh-<issue_number>
```

You can update package versions, if needed, in the new project's `package.json`. Then, run `npm install` to install dependencies. Finally, you can run `astro add react` or similar to add larger integrations to your project with automatic configuration handled for you (run this after `npm install`).

```bash
cd triage/gh-<issue_number>
# Optional: edit package.json to add/edit/remove dependencies before installing
npm install
# Optional: Run `astro add ...` to add Astro integrations like `react`, `svelte`, `vue`, etc.
```

## Step 4: Configure the Project

Based on the issue details, modify the project:

1. Update `astro.config.mjs` as needed
2. Create any required pages, components, or middleware
3. Add any necessary configuration files (e.g., `wrangler.toml` for Cloudflare)

Follow the user's reproduction steps as closely as possible.

## Step 5: Attempt Reproduction

Follow the user-provided steps in the issue to reproduce the user's issue. Make sure that you test both the working and broken case, to confirm that the project is setup correctly to start and to determine what changes to the reproduction environment actually trigger the issue.

`npm run build` is best for debugging final build issues. `npm run dev` is best for debugging server issues. `npm run preview` is also helpful.

You can use the `agent-browser` CLI to make requests to the `dev` or `preview` servers. Run `npm info agent-browser readme` to lookup the `agent-browser` documentation.


## Step 6: Document Findings

After attempting reproduction, you should know:

1. **Reproducible?** Yes or No
2. **Error details**: Exact error messages and stack traces
3. **Environment**: Package versions, Node version, etc.
4. **Steps**: The exact steps that trigger the issue

## Next Steps

- **If reproducible** and you're asked to fix it: Proceed to [FIX.md](FIX.md)
- **If not reproducible**: Document why and proceed to [REPORT.md](REPORT.md)
- **If unsupported** (old version, wrong runtime): Document why and proceed to [REPORT.md](REPORT.md)
