// Shiki helpers were moved to `@astrojs/internal-helpers/shiki` so they can be
// shared with other markdown processors (Sätteri, third-party) without pulling
// in the remark/rehype pipeline. Re-exported here for backward compatibility.
export {
	type CreateShikiHighlighterOptions,
	createShikiHighlighter,
	type ShikiHighlighter,
	type ShikiHighlighterHighlightOptions,
	type ThemePresets,
} from '@astrojs/internal-helpers/shiki';
