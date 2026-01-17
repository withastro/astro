import type { APIRoute, GetStaticPaths } from 'astro';
import type { SkillData } from '../types.js';

/**
 * Generate static paths for all skill files.
 * This enables static generation for the dynamic [skill]/[...path] route.
 */
export const getStaticPaths: GetStaticPaths = async () => {
	// Dynamic import of virtual module - resolved at runtime by Astro
	// @ts-expect-error - astro:content is a virtual module only available at runtime
	const { getCollection } = await import('astro:content');
	const skills = await getCollection('skills');

	const paths: Array<{ params: { skill: string; path: string } }> = [];

	for (const skill of skills) {
		const skillData = skill.data as SkillData;

		// Add paths for each file in the skill
		for (const filePath of Object.keys(skillData.files)) {
			paths.push({
				params: { skill: skill.id, path: filePath },
			});
		}
	}

	return paths;
};

/**
 * GET /.well-known/skills/[skill]/[...path]
 *
 * Serves files from a skill directory per the Agent Skills Discovery RFC.
 *
 * @see https://github.com/anthropics/anthropic-quickstarts/tree/main/skills-discovery-rfc
 */
export const GET: APIRoute = async ({ params }) => {
	const { skill, path } = params;

	if (!skill || !path) {
		return new Response('Skill name and file path are required', {
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

	// Look up the file in the skill's files map
	const file = skillEntry.data.files[path];

	if (!file) {
		return new Response(`File "${path}" not found in skill "${skill}"`, {
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
