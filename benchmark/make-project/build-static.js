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
		</nav>
	</header>
	<main>
		<slot />
	</main>
	<footer>
		<p>&copy; 2024 Static Site</p>
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

	// Create index page
	await fs.writeFile(
		new URL('./src/pages/index.astro', projectDir),
		`\
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Card from '../components/Card.astro';

const posts = Array.from({ length: 50 }, (_, i) => ({
	title: \`Blog Post \${i + 1}\`,
	description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
	href: \`/blog/\${i + 1}\`,
}));
---
<BaseLayout title="Home - Static Site">
	<h1>Welcome to My Static Site</h1>
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

	// Create about page
	await fs.writeFile(
		new URL('./src/pages/about.astro', projectDir),
		`\
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="About - Static Site">
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

	// Create blog directory with dynamic route
	await fs.mkdir(new URL('./src/pages/blog', projectDir), { recursive: true });

	// Create blog index page
	await fs.writeFile(
		new URL('./src/pages/blog/index.astro', projectDir),
		`\
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Card from '../../components/Card.astro';

const posts = Array.from({ length: 100 }, (_, i) => ({
	title: \`Blog Post \${i + 1}\`,
	description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
	href: \`/blog/\${i + 1}\`,
}));
---
<BaseLayout title="Blog - Static Site">
	<h1>All Blog Posts</h1>
	<div class="grid">
		{posts.map((post) => (
			<Card title={post.title} description={post.description} href={post.href} />
		))}
	</div>
</BaseLayout>`,
		'utf-8',
	);
	
	// Create dynamic route for blog posts
	await fs.writeFile(
		new URL('./src/pages/blog/[id].astro', projectDir),
		`\
---
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
	return Array.from({ length: 100 }, (_, i) => ({
		params: { id: String(i + 1) },
		props: { postNumber: i + 1 },
	}));
}

const { postNumber } = Astro.props;
---
<BaseLayout title={\`Blog Post \${postNumber} - Static Site\`}>
	<article>
		<h1>Blog Post {postNumber}</h1>
		<p class="meta">Published on January {(postNumber % 28) + 1}, 2024</p>
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

	// Create astro config for static build
	await fs.writeFile(
		new URL('./astro.config.js', projectDir),
		`\
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'static',
});`,
		'utf-8',
	);
}
