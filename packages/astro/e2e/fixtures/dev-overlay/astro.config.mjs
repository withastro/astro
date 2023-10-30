import preact from '@astrojs/preact';

export default {
	integrations: [preact()],
	experimental: {
		devOverlay: true
	}
};
