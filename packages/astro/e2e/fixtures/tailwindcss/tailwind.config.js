const path = require('path');

module.exports = {
	content: [path.join(__dirname, 'src/**/*.{astro,html,js,jsx,md,svelte,ts,tsx,vue}')],
	theme: {
		extend: {
			colors: {
				dawn: '#f3e9fa',
				dusk: '#514375',
				midnight: '#31274a',
			}
		}
	}
};
