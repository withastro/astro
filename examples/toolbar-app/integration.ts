import type { AstroIntegration } from 'astro';

export default {
	name: 'my-astro-integration',
	hooks: {
		'astro:config:setup': ({ addDevToolbarApp }) => {
			addDevToolbarApp({
				id: 'my-toolbar-app',
				name: 'My Toolbar App',
				icon: '🚀',
				entrypoint: '@example/toolbar-app/app.ts',
			});
		},
	},
} satisfies AstroIntegration;
