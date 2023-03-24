export default {
	variables: {
		countries: ['ES', 'JP'],
	},
	functions: {
		includes: {
			transform(parameters) {
				const [array, value] = Object.values(parameters);
				return Array.isArray(array) ? array.includes(value) : false;
			},
		},
	},
}
