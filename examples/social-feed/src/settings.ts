import { iconPaths } from './components/IconPaths.js'
import avatar from './assets/avatar.webp'

export interface Image {
	src: ImageMetadata
	alt: string
}

export interface Settings {
	name: string
	username: string
	avatar: Image
	rss: {
		title: string,
		description: string
	},
	pronouns?: string | undefined
	location?: string | undefined 
	homepage?: string | undefined
	social: Partial<{
		[icon in keyof typeof iconPaths]: {
			url: string,
			title: string,
		}
	}>
}

const settings: Settings = {
	name: 'Houston Astro',
	username: '@houston',
	avatar: {
		src: avatar,
		alt: 'Astro mascot Houston smiling',
	},
	rss: {
		title: 'Houston Astro’s Feed',
		description: 'Stay up-to-date with the latest posts from Houston Astro!',
	},
	pronouns: 'They/Them',
	location: 'Space',
	homepage: 'https://astro.build',
	social: {
		twitter: {
			url: 'https://twitter.com/astrodotbuild',
			title: 'Twitter'
		},
		github: {
			url: 'https://github.com/withastro',
			title: 'GitHub',
		},
		mastodon: {
			url: 'https://m.webtoo.ls/@astro',
			title: 'Mastodon'
		},
		youtube: {
			url: 'https://www.youtube.com/@astrodotbuild',
			title: 'YouTube',
		},
		discord: {
			url: 'https://astro.build/chat',
			title: 'Discord'
		}
	},
};

export default settings;
