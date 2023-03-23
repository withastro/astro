import Aside from './src/components/Aside.astro';

export default {
	tags: {
		aside: {
			render: Aside,
			attributes: {
				type: { type: String },
				title: { type: String },
			},
		},
	},
};
