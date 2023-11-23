import { frontmatter } from './vite-env-vars.mdx';

export function GET() {
	return {
		body: JSON.stringify(frontmatter),
	}
}
