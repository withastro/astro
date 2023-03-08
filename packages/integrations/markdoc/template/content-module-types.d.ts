declare module 'astro:content' {
	interface Render {
		'.mdoc': Promise<{
			Content(props: {
				components?: Record<string, import('astro').AstroInstance['default']>;
			}): import('astro').MarkdownInstance<{}>['Content'];
		}>;
	}
}
