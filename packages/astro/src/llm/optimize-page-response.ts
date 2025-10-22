import TurndownService from 'turndown';

const turndownService = new TurndownService({
	// Use # for headings instead of underlines
	headingStyle: 'atx',
	// Use ``` for code blocks instead of indentation
	codeBlockStyle: 'fenced',
});

// Remove elements that aren't useful for LLMs
turndownService.remove(['script', 'style', 'nav', 'footer']);

export async function optimizePageResponse(
	html: string,
): Promise<string> {
	return turndownService.turndown(html);
}

export async function processLLMResponse(
	response: Response,
	request: Request,
): Promise<Response> {
	// Check if the request accepts markdown
	const acceptHeader = request.headers.get('accept');
	const wantsMarkdown = acceptHeader?.includes('text/markdown');

	// Only convert HTML responses to markdown
	if (
		wantsMarkdown &&
		response.headers.get('content-type')?.includes('text/html')
	) {
		const html = await response.clone().text();
		const markdown = await optimizePageResponse(html);

		const headers = new Headers(response.headers);
		headers.set('content-type', 'text/markdown; charset=utf-8');

		return new Response(markdown, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	}

	return response;
}
