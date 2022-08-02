import { readingTime, injectedReadingTime } from './space-ipsum.mdx';

export function get() {
	return {
		body: JSON.stringify({ readingTime, injectedReadingTime }),
	}
}
