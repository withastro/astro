---
'astro': minor
---

Adds a `consume()` instance method to `AstroCookies`. This method marks the cookies as consumed and returns the `Set-Cookie` header values. After consumption, any subsequent `set()` calls will log a warning, since the headers have already been sent.

Previously this was only available as a static method `AstroCookies.consume(cookies)`. The static method is now deprecated but kept for backward compatibility with existing adapters.
