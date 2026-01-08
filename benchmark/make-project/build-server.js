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
			<a href="/dashboard">Dashboard</a>
		</nav>
	</header>
	<main>
		<slot />
	</main>
	<footer>
		<p>&copy; 2024 Server Site - Rendered at {new Date().toISOString()}</p>
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

	// Create a dynamic component that shows server info
	await fs.writeFile(
		new URL('./src/components/ServerInfo.astro', projectDir),
		`\
---
const timestamp = new Date().toISOString();
const requestUrl = Astro.url.href;
---
<aside class="server-info">
	<p><strong>Server-rendered at:</strong> {timestamp}</p>
	<p><strong>Request URL:</strong> {requestUrl}</p>
</aside>`,
		'utf-8',
	);

	// Create index page (server-rendered)
	await fs.writeFile(
		new URL('./src/pages/index.astro', projectDir),
		`\
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Card from '../components/Card.astro';
import ServerInfo from '../components/ServerInfo.astro';

const posts = Array.from({ length: 50 }, (_, i) => ({
	title: \`Blog Post \${i + 1}\`,
	description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
	href: \`/blog/\${i + 1}\`,
}));

const randomFeatured = Math.floor(Math.random() * posts.length);
---
<BaseLayout title="Home - Server Site">
	<ServerInfo />
	<h1>Welcome to My Server-Rendered Site</h1>
	<p>${loremIpsumHtml}</p>
	<section class="posts">
		<h2>Latest Posts (Featured: Post {randomFeatured + 1})</h2>
		<div class="grid">
			{posts.map((post) => (
				<Card title={post.title} description={post.description} href={post.href} />
			))}
		</div>
	</section>
</BaseLayout>`,
		'utf-8',
	);

	// Create about page (server-rendered)
	await fs.writeFile(
		new URL('./src/pages/about.astro', projectDir),
		`\
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ServerInfo from '../components/ServerInfo.astro';

const visitCount = Math.floor(Math.random() * 10000);
---
<BaseLayout title="About - Server Site">
	<ServerInfo />
	<h1>About Us</h1>
	<p>Visit count: {visitCount}</p>
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

	// Create blog index page (server-rendered)
	await fs.writeFile(
		new URL('./src/pages/blog/index.astro', projectDir),
		`\
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Card from '../../components/Card.astro';
import ServerInfo from '../../components/ServerInfo.astro';

const posts = Array.from({ length: 100 }, (_, i) => ({
	title: \`Blog Post \${i + 1}\`,
	description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
	href: \`/blog/\${i + 1}\`,
}));

const currentPage = 1;
const totalPages = Math.ceil(posts.length / 10);
---
<BaseLayout title="Blog - Server Site">
	<ServerInfo />
	<h1>All Blog Posts</h1>
	<p>Page {currentPage} of {totalPages}</p>
	<div class="grid">
		{posts.map((post) => (
			<Card title={post.title} description={post.description} href={post.href} />
		))}
	</div>
</BaseLayout>`,
		'utf-8',
	);

	// Create dynamic route for blog posts (all server-rendered)
	await fs.writeFile(
		new URL('./src/pages/blog/[id].astro', projectDir),
		`\
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ServerInfo from '../../components/ServerInfo.astro';

const { id } = Astro.params;
const postNumber = Number(id);
const viewCount = Math.floor(Math.random() * 5000);
const likes = Math.floor(Math.random() * 500);
---
<BaseLayout title={\`Blog Post \${postNumber} - Server Site\`}>
	<ServerInfo />
	<article>
		<h1>Blog Post {postNumber}</h1>
		<p class="meta">Published on January {(postNumber % 28) + 1}, 2024</p>
		<p class="stats">Views: {viewCount} | Likes: {likes}</p>
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
		<section>
			<h2>Comments ({Math.floor(Math.random() * 50)})</h2>
			<ul>
				{Array.from({ length: 10 }, (_, j) => (
					<li>Comment {j + 1} from User {Math.floor(Math.random() * 1000)}</li>
				))}
			</ul>
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
export async function GET({ params, request }) {
	return new Response(JSON.stringify({
		timestamp: new Date().toISOString(),
		random: Math.random(),
		data: Array.from({ length: 100 }, (_, i) => ({
			id: i + 1,
			title: \`Item \${i + 1}\`,
			value: Math.random() * 1000,
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

	// Create multiple API endpoints
	await fs.writeFile(
		new URL('./src/pages/api/users.json.js', projectDir),
		`\
export async function GET({ params, request }) {
	const users = Array.from({ length: 50 }, (_, i) => ({
		id: i + 1,
		name: \`User \${i + 1}\`,
		email: \`user\${i + 1}@example.com\`,
		active: Math.random() > 0.5,
	}));

	return new Response(JSON.stringify({
		timestamp: new Date().toISOString(),
		users,
	}), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}`,
		'utf-8',
	);

	await fs.writeFile(
		new URL('./src/pages/api/stats.json.js', projectDir),
		`\
export async function GET({ params, request }) {
	return new Response(JSON.stringify({
		timestamp: new Date().toISOString(),
		pageViews: Math.floor(Math.random() * 100000),
		uniqueVisitors: Math.floor(Math.random() * 10000),
		bounceRate: (Math.random() * 100).toFixed(2),
		avgSessionDuration: Math.floor(Math.random() * 600),
	}), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}`,
		'utf-8',
	);

	// Create a dynamic dashboard page
	await fs.writeFile(
		new URL('./src/pages/dashboard.astro', projectDir),
		`\
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ServerInfo from '../components/ServerInfo.astro';

const timestamp = new Date().toISOString();
const randomValue = Math.random();
const stats = {
	activeUsers: Math.floor(Math.random() * 1000),
	revenue: (Math.random() * 100000).toFixed(2),
	orders: Math.floor(Math.random() * 500),
	conversion: (Math.random() * 10).toFixed(2),
};
---
<BaseLayout title="Dashboard - Server Site">
	<ServerInfo />
	<h1>Dashboard (Server-Rendered)</h1>
	<p>This page is rendered on-demand for each request.</p>
	<dl>
		<dt>Server Time:</dt>
		<dd>{timestamp}</dd>
		<dt>Random Value:</dt>
		<dd>{randomValue}</dd>
	</dl>
	<section>
		<h2>Real-time Stats</h2>
		<div class="stats-grid">
			<div class="stat">
				<h3>Active Users</h3>
				<p>{stats.activeUsers}</p>
			</div>
			<div class="stat">
				<h3>Revenue</h3>
				<p>\${stats.revenue}</p>
			</div>
			<div class="stat">
				<h3>Orders</h3>
				<p>{stats.orders}</p>
			</div>
			<div class="stat">
				<h3>Conversion Rate</h3>
				<p>{stats.conversion}%</p>
			</div>
		</div>
	</section>
	<section>
		<h2>Recent Activity</h2>
		<ul>
			{Array.from({ length: 20 }, (_, i) => (
				<li>Activity {i + 1}: User {Math.floor(Math.random() * 1000)} performed action at {new Date(Date.now() - Math.random() * 3600000).toISOString()}</li>
			))}
		</ul>
	</section>
</BaseLayout>`,
		'utf-8',
	);

	// Create a search page with dynamic results
	await fs.writeFile(
		new URL('./src/pages/search.astro', projectDir),
		`\
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ServerInfo from '../components/ServerInfo.astro';
import Card from '../components/Card.astro';

const url = new URL(Astro.request.url);
const query = url.searchParams.get('q') || '';
const resultsCount = query ? Math.floor(Math.random() * 100) : 0;

const results = Array.from({ length: Math.min(resultsCount, 20) }, (_, i) => ({
	title: \`Result \${i + 1} for "\${query}"\`,
	description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
	href: \`/blog/\${Math.floor(Math.random() * 100) + 1}\`,
}));
---
<BaseLayout title={\`Search: \${query} - Server Site\`}>
	<ServerInfo />
	<h1>Search Results</h1>
	<form method="get" action="/search">
		<input type="text" name="q" value={query} placeholder="Search..." />
		<button type="submit">Search</button>
	</form>
	{query && (
		<p>Found {resultsCount} results for "{query}"</p>
	)}
	{results.length > 0 && (
		<div class="grid">
			{results.map((result) => (
				<Card title={result.title} description={result.description} href={result.href} />
			))}
		</div>
	)}
	{query && results.length === 0 && (
		<p>No results found.</p>
	)}
</BaseLayout>`,
		'utf-8',
	);

	// Create astro config for server build with adapter
	await fs.writeFile(
		new URL('./astro.config.js', projectDir),
		`\
import { defineConfig } from 'astro/config';
import adapter from '@benchmark/adapter';

export default defineConfig({
	output: 'server',
	adapter: adapter(),
});`,
		'utf-8',
	);
}
