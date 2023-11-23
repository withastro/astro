import { frontmatter } from './vite-env-vars.mdx';

export function get() {
	return Response.json(frontmatter);
}
