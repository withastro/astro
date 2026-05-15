import netlifyIntegration from './index.js';
function functionsIntegration(config) {
	console.warn(
		'The @astrojs/netlify/functions import is deprecated and will be removed in a future release. Please use @astrojs/netlify instead.',
	);
	return netlifyIntegration(config);
}
export { functionsIntegration as default };
