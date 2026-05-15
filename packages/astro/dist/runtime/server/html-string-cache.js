import { HTMLString } from './escape.js';
class HTMLStringCache {
	cache = /* @__PURE__ */ new Map();
	maxSize;
	constructor(maxSize = 1e3) {
		this.maxSize = maxSize;
		this.warm(COMMON_HTML_PATTERNS);
	}
	/**
	 * Get or create an HTMLString for the given content.
	 * If cached, the existing object is returned and moved to end (most recently used).
	 * If not cached, a new HTMLString is created, cached, and returned.
	 *
	 * @param content - The HTML string content
	 * @returns HTMLString object (cached or newly created)
	 */
	getOrCreate(content) {
		const cached = this.cache.get(content);
		if (cached) {
			this.cache.delete(content);
			this.cache.set(content, cached);
			return cached;
		}
		const htmlString = new HTMLString(content);
		this.cache.set(content, htmlString);
		if (this.cache.size > this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey !== void 0) {
				this.cache.delete(firstKey);
			}
		}
		return htmlString;
	}
	/**
	 * Get current cache size
	 */
	size() {
		return this.cache.size;
	}
	/**
	 * Pre-warms the cache with common HTML patterns.
	 * This ensures first-render cache hits for frequently used tags.
	 *
	 * @param patterns - Array of HTML strings to pre-cache
	 */
	warm(patterns) {
		for (const pattern of patterns) {
			if (!this.cache.has(pattern)) {
				this.cache.set(pattern, new HTMLString(pattern));
			}
		}
	}
	/**
	 * Clear the entire cache
	 */
	clear() {
		this.cache.clear();
	}
}
const COMMON_HTML_PATTERNS = [
	// Structural elements
	'<div>',
	'</div>',
	'<span>',
	'</span>',
	'<p>',
	'</p>',
	'<section>',
	'</section>',
	'<article>',
	'</article>',
	'<header>',
	'</header>',
	'<footer>',
	'</footer>',
	'<nav>',
	'</nav>',
	'<main>',
	'</main>',
	'<aside>',
	'</aside>',
	// List elements
	'<ul>',
	'</ul>',
	'<ol>',
	'</ol>',
	'<li>',
	'</li>',
	// Void/self-closing elements
	'<br>',
	'<hr>',
	'<br/>',
	'<hr/>',
	// Heading elements
	'<h1>',
	'</h1>',
	'<h2>',
	'</h2>',
	'<h3>',
	'</h3>',
	'<h4>',
	'</h4>',
	// Inline elements
	'<a>',
	'</a>',
	'<strong>',
	'</strong>',
	'<em>',
	'</em>',
	'<code>',
	'</code>',
	// Common whitespace
	' ',
	'\n',
];
export { COMMON_HTML_PATTERNS, HTMLStringCache };
