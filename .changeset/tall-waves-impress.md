---
'astro': minor
---

Changes the default behavior for Astro Action form requests to a standard POST submission.

In Astro 4.x, actions called from an HTML form would trigger a redirect with the result forwarded using cookies. This caused issues for large form errors and return values that exceeded the 4 KB limit of cookie-based storage.

Astro 5.0 now renders the result of an action as a POST result without any forwarding. This will introduce a "confirm form resubmission?" dialog when a user attempts to refresh the page, though it no longer imposes a 4 KB limit on action return value.

## Customize form submission behavior

If you prefer to address the "confirm form resubmission?" dialog on refresh, or to preserve action results across sessions, you can now [customize action result handling from middleware](/en/guides/actions/#advanced-persist-action-results-with-a-session).

We recommend using a session storage provider [as described in our Netlify Blob example](/en/guides/actions/#advanced-persist-action-results-with-a-session). However, if you prefer the cookie forwarding behavior from 4.X and accept the 4 KB size limit, you can implement the pattern as shown in this sample snippet:

```ts 
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { getActionContext } from 'astro:actions';

export const onRequest = defineMiddleware(async (context, next) => {
  // Skip requests for prerendered pages
  if (context.isPrerendered) return next();

	const { action, setActionResult, serializeActionResult } = getActionContext(context);

	// If an action result was forwarded as a cookie, set the result
	// to be accessible from `Astro.getActionResult()`
	const payload = context.cookies.get('ACTION_PAYLOAD');
	if (payload) {
		const { actionName, actionResult } = payload.json();
		setActionResult(actionName, actionResult);
		context.cookies.delete('ACTION_PAYLOAD');
		return next();
	}

	// If an action was called from an HTML form action,
	// call the action handler and redirect with the result as a cookie.
	if (action?.calledFrom === 'form') {
		const actionResult = await action.handler();

		context.cookies.set('ACTION_PAYLOAD', {
			actionName: action.name,
			actionResult: serializeActionResult(actionResult),
		});

		if (actionResult.error) {
		// Redirect back to the previous page on error
			const referer = context.request.headers.get('Referer');
			if (!referer) {
				throw new Error('Internal: Referer unexpectedly missing from Action POST request.');
			}
			return context.redirect(referer);
		}
		// Redirect to the destination page on success
		return context.redirect(context.originPathname);
	}

	return next();
})
```
