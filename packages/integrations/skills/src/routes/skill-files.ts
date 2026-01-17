import type { APIRoute } from 'astro';
import type { SkillData } from '../types.js';

/**
 * GET /.well-known/skills/[skill]/[...path]
 *
 * Serves files from a skill directory per the Agent Skills Discovery RFC.
 * If no path is provided, defaults to serving SKILL.md.
 *
 * @see https://github.com/anthropics/anthropic-quickstarts/tree/main/skills-discovery-rfc
 */
export const GET: APIRoute = async ({ params }) => {
	const { skill, path } = params;

	if (!skill) {
		return new Response('Skill name is required', {
			status: 400,
			headers: { 'Content-Type': 'text/plain' },
		});
	}

	// Dynamic import of virtual module - resolved at runtime by Astro
	// @ts-expect-error - astro:content is a virtual module only available at runtime
	const { getEntry } = await import('astro:content');

	// Get the skill from the content collection
	const skillEntry = (await getEntry('skills', skill)) as { data: SkillData } | undefined;

	if (!skillEntry) {
		return new Response(`Skill "${skill}" not found`, {
			status: 404,
			headers: { 'Content-Type': 'text/plain' },
		});
	}

	// Default to SKILL.md if no path is provided
	const filePath = path || 'SKILL.md';

	// Look up the file in the skill's files map
	const file = skillEntry.data.files[filePath];

	if (!file) {
		return new Response(`File "${filePath}" not found in skill "${skill}"`, {
			status: 404,
			headers: { 'Content-Type': 'text/plain' },
		});
	}

	// Decode content based on encoding
	let body: BodyInit;
	if (file.encoding === 'base64') {
		// Convert base64 to binary using Buffer (available in Node.js environments)
		body = Buffer.from(file.content, 'base64');
	} else {
		body = file.content;
	}

	return new Response(body, {
		status: 200,
		headers: {
			'Content-Type': file.contentType,
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
