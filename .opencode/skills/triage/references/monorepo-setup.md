# Monorepo Setup for Triage Projects

The Astro repository is a pnpm monorepo. Triage projects live in the `triage/` directory and are configured to use local packages from `packages/`.

## Directory Structure

```
astro/
├── packages/
│   ├── astro/              # Core Astro package
│   ├── integrations/       # @astrojs/* integrations
│   └── ...
├── examples/               # Example templates
├── triage/                 # Your reproduction projects (gitignored)
│   └── gh-12345-abc/       # Reproduction for issue #12345
│       ├── package.json    # Uses workspace:* for astro deps
│       ├── astro.config.mjs
│       └── src/
└── pnpm-workspace.yaml     # Includes triage/* as workspace
```

## How Workspace Linking Works

The triage project's `package.json` uses `workspace:*` for Astro dependencies:

```json
{
  "dependencies": {
    "astro": "workspace:*",
    "@astrojs/react": "workspace:*"
  }
}
```

After running `pnpm install` at the repo root, these resolve to the local packages in `packages/`. This means:
- Changes to `packages/astro/` immediately affect the triage project
- You can add console.log statements to debug
- You can test fixes without publishing

## Adding Dependencies

Run these commands **from the triage project directory**:

```bash
cd triage/gh-12345-abc

# Add an integration with auto-configuration
pnpm astro add react
pnpm astro add mdx
pnpm astro add node

# Add other npm packages
pnpm add lodash
```

After adding dependencies, you may need to run `pnpm install` at the repo root again.

## Running Commands

Always run commands from the triage project directory:

```bash
cd triage/gh-12345-abc

# Development server
pnpm run dev

# Production build
pnpm run build

# Preview production build
pnpm run preview
```

## Making Changes to Astro Source

To test a fix:

1. Edit the source file in `packages/`
2. Rebuild that package:
   ```bash
   cd packages/astro  # or packages/integrations/<name>
   pnpm build
   ```
3. Re-run your reproduction to verify the fix

## Testing in the Browser

Use `agent-browser` to interact with dev/preview servers:

```bash
# Get documentation
npm info agent-browser readme

# Example usage
npx agent-browser http://localhost:4321/page-to-test
```

## Cleanup

Triage directories are gitignored and can be deleted when done:

```bash
rm -rf triage/gh-12345-abc
```
