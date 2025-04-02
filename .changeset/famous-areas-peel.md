---
'astro': patch
---

Adds support for loading a session by ID

Adds a new `session.load()` method to the experimental session API that allows you to load a session by ID. In normal use a session is loaded automatically from the session cookie. This method allows a session to be loaded manually instead. This is useful for cases where the session ID has been persisted somewhere other than the browser cookie. For example, a session ID might be stored in a user database. This would allow that user's session to be loaded when logging-in on another device or in a different browser. It would also allow a session to be loaded in an API when cookies can't be set, such as when loading across domains.
