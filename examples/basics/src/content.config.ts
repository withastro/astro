import { defineCollection } from 'astro:content';
import { skillsLoader } from '@astrojs/skills';

export const collections = {
	skills: defineCollection({
		loader: skillsLoader({ base: './skills' }),
	}),
};
