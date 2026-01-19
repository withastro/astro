import { z } from 'astro/zod';

/**
 * Schema for a single file within a skill
 */
export const skillFileSchema = z.object({
	/** File content (UTF-8 string or base64-encoded for binary files) */
	content: z.string(),
	/** Encoding used for the content */
	encoding: z.enum(['utf-8', 'base64']).default('utf-8'),
	/** MIME type of the file */
	contentType: z.string(),
});

/**
 * Schema for skill data stored in the content collection
 */
export const skillSchema = z.object({
	/** Skill name from SKILL.md frontmatter */
	name: z.string().min(1).max(64),
	/** Skill description from SKILL.md frontmatter */
	description: z.string().max(1024),
	/** All files in the skill directory, keyed by relative path */
	files: z.record(z.string(), skillFileSchema),
});

export type SkillFileSchema = z.infer<typeof skillFileSchema>;
export type SkillSchema = z.infer<typeof skillSchema>;
