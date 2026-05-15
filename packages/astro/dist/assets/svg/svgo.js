import { optimize } from 'svgo';
function svgoOptimizer(config) {
	return {
		name: 'svgo',
		optimize: (contents) => optimize(contents, config).data,
	};
}
export { svgoOptimizer };
