---
'astro': minor
---

Change Action cookie redirects to an opt-in feature users can implement using middleware. This means Actions submitted from an HTML form action will no longer redirect to the destination as a GET request. Instead, the page will be rendered as a POST result.

This is meant to address the 4 KB size limit users have encountered when calling actions from an HTML form action. It can be difficult to predict the size of an action result for large validation errors or longer return values, like AI chatbot results.

So, we've introduced a new `getActionContext()` utility to let you decide how action results are handled from middleware. You may choose to implement the existing cookie redirect from Astro v4, or implement forwarding with your own session storage.

## Migration

Cookie redirects are no longer handled by default. You can implement the behavior from Astro v4 as a middleware using `getActionContext()` like so:

```ts
import { defineMiddleware } from 'astro:middleware';
import { getActionContext } from 'astro:actions';

export const onRequest = defineMiddleware(async (context, next) => {
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
