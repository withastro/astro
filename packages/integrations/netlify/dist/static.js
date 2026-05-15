import netlifyIntegration from './index.js';
function staticIntegration() {
	console.warn(
		'The @astrojs/netlify/static import is deprecated and will be removed in a future release. Please use @astrojs/netlify instead.',
	);
	return netlifyIntegration();
}
export { staticIntegration as default };
