import { frontmatter } from './index.mdx';

export function get() {
	return {
		body: JSON.stringify(frontmatter),
	}
}
