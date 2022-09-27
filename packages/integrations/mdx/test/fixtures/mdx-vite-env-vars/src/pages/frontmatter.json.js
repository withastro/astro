import { frontmatter } from './vite-env-vars.mdx';

export function get() {
	return {
		body: JSON.stringify(frontmatter),
	}
}
