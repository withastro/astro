import { frontmatter } from './vite-env-vars.md';

export async function GET() {
	return {
		body: JSON.stringify(frontmatter),
	}
}
