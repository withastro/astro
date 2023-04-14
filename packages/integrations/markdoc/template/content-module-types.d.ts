declare module 'astro:content' {
	interface Render {
		'.md': Promise<{
			Content(props: Record<string, any>): import('astro').MarkdownInstance<{}>['Content'];
		}>;
	}
}
