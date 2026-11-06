---
'astro': patch
---

Creates history entries synchronously for user-activated GET navigations with `<ClientRouter />`, so browsers can retain these navigations in their Back history. Pending entries preserve the current document URL while loading, retain GET destinations for Forward or reload, and are reused or replaced when navigation is interrupted or falls back to a full page load. A POST that supersedes a pending GET clears the replay target until the submission commits, preventing reload or traversal from replaying it as a GET.
