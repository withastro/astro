import { readingTime } from './space-ipsum.mdx';

export function get() {
	return {
		body: JSON.stringify(readingTime),
	}
}
