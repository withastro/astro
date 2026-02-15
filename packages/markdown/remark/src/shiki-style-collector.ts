import type { ShikiTransformerStyleToClass } from './transformers/style-to-class.js';

/**
 * Global singleton to collect Shiki styles from multiple transformer instances.
 *
 * Each code block (whether from Code.astro or markdown) creates a new transformer instance.
 * This collector aggregates styles from all instances so they can be bundled into a single
 * CSS file via the virtual module system.
 */
class ShikiStyleCollector {
	private transformers = new Set<ShikiTransformerStyleToClass>();

	/**
	 * Register a transformer instance to collect styles from.
	 * Returns the same transformer to allow chaining.
	 */
	register(transformer: ShikiTransformerStyleToClass): ShikiTransformerStyleToClass {
		this.transformers.add(transformer);
		return transformer;
	}

	/**
	 * Collect CSS from all registered transformers.
	 * This is called by the virtual CSS module to generate the final stylesheet.
	 */
	collectCSS(): string {
		let css = '';
		for (const transformer of this.transformers) {
			css += transformer.getCSS();
		}
		return css;
	}

	/**
	 * Clear all registered transformers and their style registries.
	 * Called during HMR in dev mode to prevent stale styles.
	 */
	clear(): void {
		for (const transformer of this.transformers) {
			transformer.clearRegistry();
		}
		this.transformers.clear();
	}
}

/**
 * Global instance of the style collector.
 * Shared between Code.astro component and markdown processing.
 */
export const globalShikiStyleCollector = new ShikiStyleCollector();
