import { frontmatter } from './vite-env-vars.md';

export async function get() {
	return {
		body: JSON.stringify(frontmatter),
	}
}
