import type { AstroIntegration } from 'astro';

export default function createPlugin(): AstroIntegration {
	return {
		name: '@astrojs/jquery',
		hooks: {
			'astro:config:setup': ({ injectScript }) => {
				// I can't find another way to import jquery before script tags on the page 🤷
				injectScript(
					'head-inline',
					`document.write("<script src='https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.1/jquery.min.js' integrity='sha512-aVKKRRi/Q/YV+4mjoKBsE4x3H+BkegoM/em46NNlCqNTmUYADjBbeNefNxYV7giUp0VxICtqdrbqU7iVaeZNXA==' crossorigin='anonymous' referrerpolicy='no-referrer' />");`
				);
			},
		},
	};
}
