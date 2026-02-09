# Notes for Agents

- `astro dev` and `astro preview` are long-running commands, always run them in the background to avoid blocking other tasks. Use `&` to run them in the background, set a `timeout` parameter for the command, or terminate them when done with the task.
- always use `curl` `--max-time` flag to set a max timeout on HTTP requests. This prevents a bad connection from hanging your entire session.