---
'astro': patch
---

Improves user experience when render an Action result from a form POST request:

- Removes "Confirm post resubmission?" dialog when refreshing a result.
- Removes the `?_astroAction=NAME` flag when a result is rendered.

Also improves the DX of directing to a new route on success. Actions will now redirect to the route specified in your `action` string on success, and redirect back to the previous page on error. This follows the routing convention of established backend frameworks like Laravel.

For example, say you want to redirect to a `/success` route when `actions.signup` succeeds. You can add `/success` to your `action` string like so:

```astro
<form method="POST" action={"/success" + actions.signup}>
```

- On success, Astro will redirect to `/success`. 
- On error, Astro will redirect back to the current page.

You can retrieve the action result from either page using the `Astro.getActionResult()` function.

### Note on security

This uses a temporary cookie to forward the action result to the next page. The cookie will be deleted when that page is rendered.

⚠ **The action result is not encrypted.** In general, we recommend returning minimal data from an action handler to a) avoid leaking sensitive information, and b) avoid unexpected render issues once the temporary cookie is deleted. For example, a `login` function may return a user's session id to retrieve from your Astro frontmatter, rather than the entire user object.
