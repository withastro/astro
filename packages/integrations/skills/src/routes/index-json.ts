import type { APIRoute } from 'astro';
import type { SkillsIndex } from '../types.js';

/**
 * GET /.well-known/skills/index.json
 *
 * Returns a JSON index of all available skills per the Agent Skills Discovery RFC.
 *
 * @see https://github.com/anthropics/anthropic-quickstarts/tree/main/skills-discovery-rfc
 */
export const GET: APIRoute = async () => {
	// Dynamic import of virtual module - resolved at runtime by Astro
	// @ts-expect-error - astro:content is a virtual module only available at runtime
	const { getCollection } = await import('astro:content');
	const skills = await getCollection('skills');

	const index: SkillsIndex = {
		skills: skills.map((skill: { data: { name: string; description: string } }) => ({
			name: skill.data.name,
			description: skill.data.description,
		})),
	};

	return new Response(JSON.stringify(index, null, 2), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
