# Notes for Agents

- Always run `astro dev` and `astro preview` in the background to prevent hanging your entire session. Use `&` to run them in the background, and terminate them once you've completed your work.
- Always use `curl` `--max-time` flag to set a max timeout on HTTP requests, to prevent hanging your entire session.
- Use `agent-browser` for web automation. Run `agent-browser --help` for all commands. Core workflow:
  - `agent-browser open <url>` - Navigate to page
  - `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
  - `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
  - Re-snapshot after page changes
  - The browser session persists, so HMR works when using `astro dev`
  - If `agent-browser` does not exist, suggest that the user download it.

## Astro Documentation

- **LLM-optimized**: https://docs.astro.build/llms.txt (llm-optimized)
- **Full docs**: https://docs.astro.build/ (human-optimized, primary source, use when llms.txt lacks info)

## Running Tests

- Run `pnpm test` in workspace root or package directory to run full test suite (can be slow!)
- Integration tests live in special `packages/integrations` folders.
- `cd` into the desired package directory, then use `pnpm astro-scripts` test runner
- Run a single test file: ` pnpm astro-scripts test "test/actions.test.js"`
- Run specific tests matching a string or regex patterns: `pnpm astro-scripts test "test/**/*.test.js" --match "CSS"`
- Run multiple test files: `pnpm astro-scripts test "test/{actions,css,middleware}.test.js"`
- Key flags:
  - `--match` / `-m`: Filter tests by name pattern (regex)
  - `--only` / `-o`: Run only tests marked with `.only`
  - `--parallel` / `-p`: Run tests in parallel (default is sequential)
  - `--timeout` / `-t`: Set timeout in milliseconds
  - `--watch` / `-w`: Watch mode