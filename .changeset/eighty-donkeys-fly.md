---
'astro': minor
---

The following renderer fields and integration fields now accept `URL` as a type:

**Renderers**:
- `AstroRenderer.clientEntrpoint`
- `AstroRenderer.serverEntrypoint`

**Integrations**:
- `InjectedRoute.entrypoint`
- `AstroIntegrationMiddleware.entrypoint`
- `DevToolbarAppEntry.entrypoint`
