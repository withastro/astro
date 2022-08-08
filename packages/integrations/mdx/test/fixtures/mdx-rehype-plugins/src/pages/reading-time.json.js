import * as exps from './space-ipsum.mdx';

export function get() {
	return {
		body: JSON.stringify(exps),
	}
}
