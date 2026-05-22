# Repro: Transport invoke timed out in Docker / WSL2

Minimal reproduction for issue #13439.

## Steps to reproduce

1. Install Docker Desktop with WSL2 backend on Windows 11
2. Clone this folder
3. Run `docker compose up`
4. Open `http://localhost:4321` in your browser
5. Observe the error in the container logs:

```
[ERROR] transport invoke timed out after 60000ms
```

## Environment

- Astro v5.7.13
- Node v24
- Docker with WSL2 backend
- Also reproduced on macOS (reported by others)

## Notes

This appears to be related to Vite's module runner timeout when
crossing filesystem boundaries in virtualized environments.
Possibly related to #19430 (@rollup/plugin-node-resolve).
