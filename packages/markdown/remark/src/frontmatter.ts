// Frontmatter helpers were moved to `@astrojs/internal-helpers/frontmatter` so they
// can be used from astro core without requiring `@astrojs/markdown-remark` (which is
// now an optional peer dep in v7). Re-exported here for backward compatibility.
export {
	extractFrontmatter,
	isFrontmatterValid,
	type ParseFrontmatterOptions,
	type ParseFrontmatterResult,
	parseFrontmatter,
} from '@astrojs/internal-helpers/frontmatter';
