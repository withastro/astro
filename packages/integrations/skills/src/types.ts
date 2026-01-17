/**
 * Options for the skills integration
 */
export interface SkillsIntegrationOptions {
	/**
	 * Base directory for skills, relative to project root.
	 * @default 'skills/'
	 */
	base?: string;
}

/**
 * Options for the skills loader
 */
export interface SkillsLoaderOptions {
	/**
	 * Base directory for skills, relative to project root.
	 * @default 'skills/'
	 */
	base?: string;
}

/**
 * Represents a single file within a skill
 */
export interface SkillFile {
	/** File content (UTF-8 string or base64-encoded for binary files) */
	content: string;
	/** Encoding used for the content */
	encoding: 'utf-8' | 'base64';
	/** MIME type of the file */
	contentType: string;
}

/**
 * Represents a skill's data as stored in the content collection
 */
export interface SkillData {
	/** Skill name from SKILL.md frontmatter */
	name: string;
	/** Skill description from SKILL.md frontmatter */
	description: string;
	/** All files in the skill directory, keyed by relative path */
	files: Record<string, SkillFile>;
}

/**
 * A skill entry as returned by the content collection
 */
export interface Skill {
	/** Skill ID (directory name) */
	id: string;
	/** Skill data */
	data: SkillData;
	/** SKILL.md body content (markdown without frontmatter) */
	body: string;
}

/**
 * The index.json response format per the Agent Skills Discovery RFC
 */
export interface SkillsIndex {
	skills: Array<{
		name: string;
		description: string;
	}>;
}
