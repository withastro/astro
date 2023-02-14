declare module 'astro:content' {
	type ComponentRenderer =
		| import('astro').ComponentInstance['default']
		| {
				component: import('astro').ComponentInstance['default'];
				props?(params: {
					attributes: Record<string, any>;
					getTreeNode(): import('@astrojs/markdoc').Markdoc.Tag;
				}): Record<string, any>;
		  };

	interface Render {
		'.mdoc': Promise<{
			Content(props: {
				config?: import('@astrojs/markdoc').Markdoc.Config;
				components?: Record<string, ComponentRenderer>;
			}): import('astro').MarkdownInstance<{}>['Content'];
		}>;
	}
}
