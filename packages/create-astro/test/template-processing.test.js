import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { processTemplateReadme, removeTemplateMarkerSections } from '../dist/index.js';

describe('removeTemplateMarkerSections', async () => {
	it('removes HTML template marker sections', async () => {
		const content = `# Title

Keep this content.

<!-- ASTRO:REMOVE:START -->
Remove this section.
It spans multiple lines.
<!-- ASTRO:REMOVE:END -->

Keep this too.`;

		const expected = `# Title

Keep this content.

Keep this too.`;

		const result = removeTemplateMarkerSections(content);
		assert.equal(result.trim(), expected.trim());
	});

	it('removes multiple HTML template marker sections', async () => {
		const content = `# Title

<!-- ASTRO:REMOVE:START -->
First section to remove.
<!-- ASTRO:REMOVE:END -->

Keep this content.

<!-- ASTRO:REMOVE:START -->
Second section to remove.
<!-- ASTRO:REMOVE:END -->

Final content.`;

		const expected = `# Title

Keep this content.

Final content.`;

		const result = removeTemplateMarkerSections(content);
		assert.equal(result.trim(), expected.trim());
	});

	it('handles whitespace in template marker tags', async () => {
		const content = `# Title

<!--   ASTRO:REMOVE:START   -->
Remove this content.
<!--   ASTRO:REMOVE:END   -->

Keep this.`;

		const expected = `# Title

Keep this.`;

		const result = removeTemplateMarkerSections(content);
		assert.equal(result.trim(), expected.trim());
	});

	it('is case insensitive', async () => {
		const content = `# Title

<!-- astro:remove:start -->
Remove this content.
<!-- ASTRO:REMOVE:END -->

Keep this.`;

		const expected = `# Title

Keep this.`;

		const result = removeTemplateMarkerSections(content);
		assert.equal(result.trim(), expected.trim());
	});

	it('does not modify content without template markers', async () => {
		const content = `# Title

Regular content here.

<!-- Regular HTML comment -->
More content.

// Regular line comment
Final content.`;

		const result = removeTemplateMarkerSections(content);
		assert.equal(result, content);
	});

	it('handles empty content', async () => {
		const result = removeTemplateMarkerSections('');
		assert.equal(result, '');
	});

	it('handles content with only template markers', async () => {
		const content = `<!-- ASTRO:REMOVE:START -->
Everything should be removed.
<!-- ASTRO:REMOVE:END -->`;

		const result = removeTemplateMarkerSections(content);
		assert.equal(result.trim(), '');
	});

	it('cleans up excessive whitespace', async () => {
		const content = `# Title


<!-- ASTRO:REMOVE:START -->
Remove this section.
<!-- ASTRO:REMOVE:END -->



Keep this content.`;

		const expected = `# Title

Keep this content.`;

		const result = removeTemplateMarkerSections(content);
		assert.equal(result.trim(), expected.trim());
	});

	it('handles malformed template markers gracefully', async () => {
		const content = `# Title

<!-- ASTRO:REMOVE:START -->
Missing end comment - should not break anything.

Keep this content.

<!-- ASTRO:REMOVE:START -->
Nested start comment.
<!-- ASTRO:REMOVE:END -->

Keep this too.`;

		const result = removeTemplateMarkerSections(content);
		// Should still process the properly formed section
		assert.ok(!result.includes('Nested start comment'));
		assert.ok(result.includes('Keep this too'));
	});

	it('preserves content structure and formatting', async () => {
		const content = `# My Project

## Features

- Feature 1
- Feature 2

<!-- ASTRO:REMOVE:START -->
## Development Only

This section is for developers.

### Debug Info
- Debug feature 1
- Debug feature 2
<!-- ASTRO:REMOVE:END -->

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

Regular usage instructions.`;

		const result = removeTemplateMarkerSections(content);

		// Should preserve main structure
		assert.ok(result.includes('# My Project'));
		assert.ok(result.includes('## Features'));
		assert.ok(result.includes('## Installation'));
		assert.ok(result.includes('## Usage'));

		// Should remove development section
		assert.ok(!result.includes('## Development Only'));
		assert.ok(!result.includes('Debug Info'));
		assert.ok(!result.includes('Debug feature'));
	});
});

describe('processTemplateReadme', async () => {
	it('processes README with template markers and npm package manager', async () => {
		const content = `# Test Project

<!-- ASTRO:REMOVE:START -->
Development section
<!-- ASTRO:REMOVE:END -->

## Commands

| Command | Action |
|---------|--------|
| \`npm install\` | Install dependencies |
| \`npm run dev\` | Start dev server |
| \`npm run build\` | Build project |`;

		const result = processTemplateReadme(content, 'npm');

		// Should remove template markers but keep npm commands unchanged
		assert.ok(!result.includes('Development section'));
		assert.ok(result.includes('npm install'));
		assert.ok(result.includes('npm run dev'));
		assert.ok(result.includes('npm run build'));
	});

	it('processes README with template markers and yarn package manager', async () => {
		const content = `# Test Project

<!-- ASTRO:REMOVE:START -->
Development section
<!-- ASTRO:REMOVE:END -->

## Commands

| Command | Action |
|---------|--------|
| \`npm install\` | Install dependencies |
| \`npm run dev\` | Start dev server |
| \`npm run build\` | Build project |`;

		const result = processTemplateReadme(content, 'yarn');

		// Should remove template markers and replace npm with yarn
		assert.ok(!result.includes('Development section'));
		assert.ok(result.includes('yarn install'));
		assert.ok(result.includes('yarn dev'));
		assert.ok(result.includes('yarn build'));
		assert.ok(!result.includes('npm'));
	});

	it('processes README with template markers and pnpm package manager', async () => {
		const content = `# Test Project

<!-- ASTRO:REMOVE:START -->
Development section
<!-- ASTRO:REMOVE:END -->

## Commands

| Command | Action |
|---------|--------|
| \`npm install\` | Install dependencies |
| \`npm run dev\` | Start dev server |`;

		const result = processTemplateReadme(content, 'pnpm');

		// Should remove template markers and replace npm with pnpm
		assert.ok(!result.includes('Development section'));
		assert.ok(result.includes('pnpm install'));
		assert.ok(result.includes('pnpm dev'));
		assert.ok(!result.includes('`npm '));
		assert.ok(!result.includes('npm run'));
	});

	it('handles README with no template markers and different package manager', async () => {
		const content = `# Test Project

## Commands

Run \`npm install\` and then \`npm run dev\` to start.`;

		const result = processTemplateReadme(content, 'bun');

		// Should only replace package manager
		assert.equal(
			result,
			`# Test Project

## Commands

Run \`bun install\` and then \`bun dev\` to start.`,
		);
	});

	it('handles README with only template markers and npm', async () => {
		const content = `<!-- ASTRO:REMOVE:START -->
Everything should be removed.
<!-- ASTRO:REMOVE:END -->`;

		const result = processTemplateReadme(content, 'npm');

		// Should remove all content
		assert.equal(result.trim(), '');
	});

	it('preserves complex README structure during processing', async () => {
		const content = `# My Astro Project

[![CI](https://example.com/badge.svg)](https://example.com)

<!-- ASTRO:REMOVE:START -->
[![Open in StackBlitz](https://example.com/stackblitz.svg)](https://stackblitz.com/example)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!
<!-- ASTRO:REMOVE:END -->

## Features

- ✅ Feature 1
- ✅ Feature 2

## Commands

All commands are run from the root of the project:

| Command | Action |
| :-- | :-- |
| \`npm install\` | Installs dependencies |
| \`npm run dev\` | Starts local dev server |
| \`npm run build\` | Build your production site |

## Learn More

Check out the [documentation](https://docs.astro.build).`;

		const result = processTemplateReadme(content, 'pnpm');

		// Should preserve main structure
		assert.ok(result.includes('# My Astro Project'));
		assert.ok(result.includes('[![CI]'));
		assert.ok(result.includes('## Features'));
		assert.ok(result.includes('## Commands'));
		assert.ok(result.includes('## Learn More'));

		// Should remove development section
		assert.ok(!result.includes('Open in StackBlitz'));
		assert.ok(!result.includes('Seasoned astronaut'));

		// Should replace package manager
		assert.ok(result.includes('pnpm install'));
		assert.ok(result.includes('pnpm dev'));
		assert.ok(result.includes('pnpm build'));
		assert.ok(!result.includes('`npm '));
		assert.ok(!result.includes('npm run'));

		// Should preserve formatting and structure
		assert.ok(result.includes('| Command | Action |'));
		assert.ok(result.includes('- ✅ Feature 1'));
	});
});
