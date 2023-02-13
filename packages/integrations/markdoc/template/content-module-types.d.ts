declare module 'astro:content' {
	type ComponentRenderer =
		| import('astro').ComponentInstance['default']
		| {
				component: import('astro').ComponentInstance['default'];
				props?(params: {
					attributes: Record<string, any>;
					getTreeNode(): import('@markdoc/markdoc').Tag;
				}): Record<string, any>;
		  };

	interface Render {
		'.mdoc': Promise<{
			Content(props: {
				config?: import('@markdoc/markdoc').Config;
				components?: Record<string, ComponentRenderer>;
			}): import('astro').MarkdownInstance<{}>['Content'];
		}>;
	}
}
