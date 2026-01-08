import fs from 'node:fs/promises';
import { loremIpsumHtml } from './_util.js';

/**
 * @param {URL} projectDir
 */
export async function run(projectDir) {
	await fs.rm(projectDir, { recursive: true, force: true });
	await fs.mkdir(new URL('./src/pages', projectDir), { recursive: true });
	await fs.mkdir(new URL('./src/components', projectDir), { recursive: true });
	await fs.mkdir(new URL('./src/layouts', projectDir), { recursive: true });

	// Create a base layout
	await fs.writeFile(
		new URL('./src/layouts/BaseLayout.astro', projectDir),
		`\
---
const { title } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>{title}</title>
</head>
<body>
	<header>
		<nav>
			<a href="/">Home</a>
			<a href="/about">About</a>
			<a href="/blog">Blog</a>
			<a href="/api/data">API</a>
		</nav>
	</header>
	<main>
		<slot />
	</main>
	<footer>
		<p>&copy; 2024 Hybrid Site</p>
	</footer>
</body>
</html>`,
		'utf-8',
	);

	// Create a reusable component
	await fs.writeFile(
		new URL('./src/components/Card.astro', projectDir),
		`\
---
const { title, description, href } = Astro.props;
---
<article class="card">
	<h3>{title}</h3>
	<p>{description}</p>
	<a href={href}>Read more</a>
</article>`,
		'utf-8',
	);

	// Create index page (static)
	await fs.writeFile(
		new URL('./src/pages/index.astro', projectDir),
		`\
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Card from '../components/Card.astro';

export const prerender = true;

const posts = Array.from({ length: 50 }, (_, i) => ({
	title: \`Blog Post \${i + 1}\`,
	description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
	href: \`/blog/\${i + 1}\`,
}));
---
<BaseLayout title="Home - Hybrid Site">
	<h1>Welcome to My Hybrid Site</h1>
	<p>${loremIpsumHtml}</p>
	<section class="posts">
		<h2>Latest Posts</h2>
		<div class="grid">
			{posts.map((post) => (
				<Card title={post.title} description={post.description} href={post.href} />
			))}
		</div>
	</section>
</BaseLayout>`,
		'utf-8',
	);

	// Create about page (static)
	await fs.writeFile(
		new URL('./src/pages/about.astro', projectDir),
		`\
---
import BaseLayout from '../layouts/BaseLayout.astro';

export const prerender = true;
---
<BaseLayout title="About - Hybrid Site">
	<h1>About Us</h1>
	<p>${loremIpsumHtml}</p>
	<p>${loremIpsumHtml}</p>
	<section>
		<h2>Our Team</h2>
		<ul>
			{Array.from({ length: 20 }, (_, i) => (
				<li>Team Member {i + 1}</li>
			))}
		</ul>
	</section>
</BaseLayout>`,
		'utf-8',
	);

	// Create blog directory
	await fs.mkdir(new URL('./src/pages/blog', projectDir), { recursive: true });

	// Create blog index page (static)
	await fs.writeFile(
		new URL('./src/pages/blog/index.astro', projectDir),
		`\
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Card from '../../components/Card.astro';

export const prerender = true;

const posts = Array.from({ length: 100 }, (_, i) => ({
	title: \`Blog Post \${i + 1}\`,
	description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
	href: \`/blog/\${i + 1}\`,
}));
---
<BaseLayout title="Blog - Hybrid Site">
	<h1>All Blog Posts</h1>
	<div class="grid">
		{posts.map((post) => (
			<Card title={post.title} description={post.description} href={post.href} />
		))}
	</div>
</BaseLayout>`,
		'utf-8',
	);

	// Create dynamic route for blog posts (hybrid: static for 1-50, server for 51-100)
	await fs.writeFile(
		new URL('./src/pages/blog/[id].astro', projectDir),
		`\
---
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
	// Only pre-render posts 1-50
	return Array.from({ length: 50 }, (_, i) => ({
		params: { id: String(i + 1) },
		props: { postNumber: i + 1, isStatic: true },
	}));
}

const { postNumber, isStatic } = Astro.props;
const id = Astro.params.id;
const currentPostNumber = postNumber || Number(id);
const timestamp = new Date().toISOString();
---
<BaseLayout title={\`Blog Post \${currentPostNumber} - Hybrid Site\`}>
	<article>
		<h1>Blog Post {currentPostNumber}{!isStatic && ' (Server-Rendered)'}</h1>
		<p class="meta">Published on January {(currentPostNumber % 28) + 1}, 2024</p>
		{!isStatic && <p class="server-time">Server time: {timestamp}</p>}
		${Array.from({ length: 5 })
			.map(() => `<p>${loremIpsumHtml}</p>`)
			.join('\n\t\t')}
		<section>
			<h2>Section 1</h2>
			<p>${loremIpsumHtml}</p>
		</section>
		<section>
			<h2>Section 2</h2>
			<p>${loremIpsumHtml}</p>
		</section>
	</article>
</BaseLayout>`,
		'utf-8',
	);

	// Create API routes (server-rendered)
	await fs.mkdir(new URL('./src/pages/api', projectDir), { recursive: true });
	
	await fs.writeFile(
		new URL('./src/pages/api/data.json.js', projectDir),
		`\
export const prerender = false;

export async function GET({ params, request }) {
	return new Response(JSON.stringify({
		timestamp: new Date().toISOString(),
		data: Array.from({ length: 100 }, (_, i) => ({
			id: i + 1,
			title: \`Item \${i + 1}\`,
		})),
	}), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}`,
		'utf-8',
	);

	// Create a dynamic server-rendered page
	await fs.writeFile(
		new URL('./src/pages/dashboard.astro', projectDir),
		`\
---
import BaseLayout from '../layouts/BaseLayout.astro';

export const prerender = false;

const timestamp = new Date().toISOString();
const randomValue = Math.random();
---
<BaseLayout title="Dashboard - Hybrid Site">
	<h1>Dashboard (Server-Rendered)</h1>
	<p>This page is rendered on-demand for each request.</p>
	<dl>
		<dt>Server Time:</dt>
		<dd>{timestamp}</dd>
		<dt>Random Value:</dt>
		<dd>{randomValue}</dd>
	</dl>
	<section>
		<h2>Stats</h2>
		<ul>
			{Array.from({ length: 20 }, (_, i) => (
				<li>Stat {i + 1}: {Math.floor(Math.random() * 1000)}</li>
			))}
		</ul>
	</section>
</BaseLayout>`,
		'utf-8',
	);

	// Create astro config for hybrid build with adapter
	await fs.writeFile(
		new URL('./astro.config.js', projectDir),
		`\
import { defineConfig } from 'astro/config';
import adapter from '@benchmark/adapter';

export default defineConfig({
	adapter: adapter(),
});`,
		'utf-8',
	);
}
