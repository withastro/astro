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