export default {
	transform: {
		variables: {
			shouldMarquee: true,
			href: 'https://astro.build',
		},
		tags: {
			mq: {
				render: 'marquee',
				attributes: {
					direction: {
						type: String,
						default: 'left',
						matches: ['left', 'right', 'up', 'down'],
						errorLevel: 'critical',
					},
				},
			},
			link: {
				render: 'a',
				attributes: {
					href: {
						type: String,
						required: true,
					},
				},
			},
		},
	},
};
