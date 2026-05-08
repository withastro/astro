/**
 * Asserts that a response from the Cloudflare prerender server does not
 * indicate a server error. Throws with a descriptive message including
 * the response body when the status is 500+.
 *
 * This is used by all prerenderer methods (getStaticPaths, render,
 * collectStaticImages) to surface workerd errors instead of silently
 * producing broken output.
 */
export async function assertPrerenderResponse(response: Response, label: string): Promise<void> {
	if (response.status >= 500) {
		const text = await response.text();
		const details = text ? `\n${text}` : '';
		throw new Error(
			`${label} (${response.status}: ${response.statusText}).${details}`,
		);
	}
}
