const path = require('path');

module.exports = {
	plugins: {
		tailwindcss: {
			config: path.join(__dirname, 'tailwind.config.js'), // update this if your path differs!
		},
		autoprefixer: {},
	},
};
