import fs from 'node:fs/promises';
import { loremIpsumHtml } from './_util.js';

/**
 * Generates a benchmark project targeting specific rendering hot paths
 * identified in RENDERING_PERF_PLAN.md. Each page isolates a different
 * performance-sensitive pattern so we can measure the impact of optimizations.
 */

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

const components = {
	// A leaf component with ~4 static HTML parts and a few expressions.
	// Used by many-components to stress markHTMLString + isHTMLString (#1, #2).
	'components/Card.astro': `\
---
const { title, href, index } = Astro.props;
---
<article class="card">
  <header class="card-header">
    <h2 class="card-title"><a href={href}>{title}</a></h2>
  </header>
  <div class="card-body">
    <p>Card number {index}, rendering static content around expressions.</p>
  </div>
  <footer class="card-footer">
    <span class="card-meta">Item {index}</span>
  </footer>
</article>
`,

	// A wrapper component that renders children via a default slot.
	// Used by many-slots to stress eager slot prerendering (#9).
	'components/Section.astro': `\
---
const { heading } = Astro.props;
---
<section>
  <h2>{heading}</h2>
  <slot />
</section>
`,

	// A component with 3 named slots — only default is typically used.
	// Stresses eager slot prerendering (#9).
	'components/Layout.astro': `\
---
const { title } = Astro.props;
---
<html>
  <head>
    <title>{title}</title>
    <slot name="head" />
  </head>
  <body>
    <header><slot name="header" /></header>
    <main><slot /></main>
    <footer><slot name="footer" /></footer>
  </body>
</html>
`,

	// A component that contributes a <style> to head.
	// Used by many-head-elements to stress head dedup (#3).
	'components/StyledWidget.astro': `\
---
const { color, id } = Astro.props;
---
<div class={\`widget-\${id}\`}>
  <span>Widget {id}</span>
</div>
<style>
  div { padding: 1rem; }
</style>
`,

	// A component that contributes a unique <style> to head.
	// Each instance has different CSS so dedup has to compare all of them.
	'components/UniqueStyled.astro': `\
---
const { id } = Astro.props;
const className = \`styled-\${id}\`;
---
<div class={className}>Styled {id}</div>
<style define:vars={{ id }}>
  div { order: var(--id); }
</style>
`,
};

// ---------------------------------------------------------------------------
// Content collection (used by the head-propagation pages)
// ---------------------------------------------------------------------------

// A single tiny MDX entry. MDX opts into content propagation
// (`handlePropagation: true`), so the route is marked as a propagation route
// and every rendered `<Content />` instance registers a head propagator. Plain
// data-store markdown does NOT take this path, which is why the entry must be
// MDX. Kept minimal so the pages below measure the propagator collection
// machinery, not MDX rendering.
const contentConfig = `\
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
	loader: glob({ pattern: '*', base: './data/notes' }),
});

export const collections = { notes };
`;

const noteEntry = `\
---
title: Note
---

A tiny entry rendered thousands of times per page.
`;

// Head-propagation scaling: every <Content /> instance registers a head
// propagator, so these pages put N entries in the propagator set that
// `collectPropagatedHeadParts` iterates before the head is flushed. Generated
// at two sizes so the scaling *shape* is visible, not just a point cost:
// linear collection keeps the 2000-page near 2x the 1000-page, while a
// quadratic rescan (the regression this guards against) pushes it toward 4x.
const headPropagationPage = (n) => `\
---
import { getEntry, render } from 'astro:content';

const entry = await getEntry('notes', 'note');
const { Content } = await render(entry);
const items = Array.from({ length: ${n} });
---
<html>
  <head><title>Head Propagation ${n}</title></head>
  <body>
    <h1>${n} propagating Content instances</h1>
    {items.map(() => <Content />)}
  </body>
</html>
`;

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const pages = {
	// #1, #2, #6: 200 Astro component instances, each with ~4 HTML parts.
	// Stresses markHTMLString allocs, isHTMLString checks, validateComponentProps.
	'pages/many-components.astro': `\
---
import Card from '../components/Card.astro';
const items = Array.from({ length: 200 }, (_, i) => ({
  title: \`Card \${i}\`,
  href: \`/card/\${i}\`,
  index: i,
}));
---
<html>
  <head><title>Many Components</title></head>
  <body>
    <h1>200 Component Instances</h1>
    {items.map((item) => (
      <Card title={item.title} href={item.href} index={item.index} />
    ))}
  </body>
</html>
`,

	// #2, #5, #10: Thousands of text expressions ({value}).
	// Stresses renderChild dispatch ordering, isHTMLString, escapeHTML.
	'pages/many-expressions.astro': `\
---
const items = Array.from({ length: 2000 }, (_, i) => ({
  name: \`Item \${i}\`,
  value: i * 17,
  label: i % 2 === 0 ? "even" : "odd",
}));
const title = "Expression Heavy Page";
const subtitle = "Testing renderChild dispatch";
---
<html>
  <head><title>{title}</title></head>
  <body>
    <h1>{title}</h1>
    <p>{subtitle}</p>
    <table>
      <thead>
        <tr><th>Name</th><th>Value</th><th>Label</th></tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr>
            <td>{item.name}</td>
            <td>{item.value}</td>
            <td>{item.label}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </body>
</html>
`,

	// #3: 60 components each contributing styles to <head>.
	// Stresses head deduplication O(N^2) with JSON.stringify.
	'pages/many-head-elements.astro': `\
---
import StyledWidget from '../components/StyledWidget.astro';
import UniqueStyled from '../components/UniqueStyled.astro';
// 30 instances of same component (dedup should collapse these)
const duplicated = Array.from({ length: 30 }, (_, i) => i);
// 30 instances with unique styles (dedup must compare all)
const unique = Array.from({ length: 30 }, (_, i) => i);
---
<html>
  <head><title>Many Head Elements</title></head>
  <body>
    <h1>Head Deduplication Stress Test</h1>
    {duplicated.map((i) => (
      <StyledWidget color="red" id={i} />
    ))}
    {unique.map((i) => (
      <UniqueStyled id={i} />
    ))}
  </body>
</html>
`,

	// #9: Components with multiple named slots, only default used.
	// Stresses eager slot prerendering of unused slots.
	'pages/many-slots.astro': `\
---
import Layout from '../components/Layout.astro';
import Section from '../components/Section.astro';
const sections = Array.from({ length: 100 }, (_, i) => ({
  heading: \`Section \${i}\`,
  content: \`Content for section \${i} with some text to render.\`,
}));
---
<Layout title="Slots Stress Test">
  <h1>100 Sections with Slots</h1>
  {sections.map((s) => (
    <Section heading={s.heading}>
      <p>{s.content}</p>
    </Section>
  ))}
</Layout>
`,

	// #8: Large array .map() with component children.
	// Stresses BufferedRenderer-per-array-child allocation.
	'pages/large-array.astro': `\
---
import Card from '../components/Card.astro';
const items = Array.from({ length: 5000 }, (_, i) => ({
  title: \`Item \${i}\`,
  href: \`/item/\${i}\`,
  index: i,
}));
---
<html>
  <head><title>Large Array</title></head>
  <body>
    <h1>5000 Array Items with Components</h1>
    <div class="grid">
      {items.map((item) => (
        <Card title={item.title} href={item.href} index={item.index} />
      ))}
    </div>
  </body>
</html>
`,

	// #1, #11, #12: Mostly static HTML with very few expressions.
	// Baseline for measuring overhead of the rendering machinery on static content.
	'pages/static-heavy.astro': `\
---
const title = "Static Heavy Page";
---
<html>
  <head><title>{title}</title></head>
  <body>
    <h1>{title}</h1>
    ${Array.from({ length: 200 })
			.map(
				(_, i) => `<section>
      <h2>Section ${i}</h2>
      <p>${loremIpsumHtml}</p>
      <p>${loremIpsumHtml}</p>
    </section>`,
			)
			.join('\n    ')}
  </body>
</html>
`,

	// Head-propagation propagator collection at N and 2N (see headPropagationPage).
	'pages/head-propagation-1000.astro': headPropagationPage(1000),
	'pages/head-propagation-2000.astro': headPropagationPage(2000),
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const renderPages = Object.keys(pages)
	.filter((f) => f.startsWith('pages/'))
	.map((f) => f.replace('pages/', ''));

/**
 * @param {URL} projectDir
 */
export async function run(projectDir) {
	await fs.rm(projectDir, { recursive: true, force: true });
	await fs.mkdir(new URL('./src/pages', projectDir), { recursive: true });
	await fs.mkdir(new URL('./src/components', projectDir), { recursive: true });
	await fs.mkdir(new URL('./data/notes', projectDir), { recursive: true });

	const allFiles = { ...components, ...pages, 'content.config.ts': contentConfig };

	await Promise.all(
		Object.entries(allFiles).map(([name, content]) => {
			return fs.writeFile(new URL(`./src/${name}`, projectDir), content, 'utf-8');
		}),
	);

	await fs.writeFile(new URL('./data/notes/note.mdx', projectDir), noteEntry, 'utf-8');

	await fs.writeFile(
		new URL('./astro.config.js', projectDir),
		`\
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import adapter from '@benchmark/adapter';

export default defineConfig({
	output: 'server',
	adapter: adapter(),
	integrations: [mdx()],
});`,
		'utf-8',
	);
}
