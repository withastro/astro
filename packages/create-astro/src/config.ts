import type { Integration } from './frameworks';

export const createConfig = ({ integrations }: { integrations: Integration[] }) => {
	if (integrations.length === 0) {
		return `import { defineConfig } from 'astro/config';
// https://astro.build/config
export default defineConfig({});
`;
	}

	const rendererImports = integrations.map((r) => `  import ${r.id} from '${r.packageName}';`);
	const rendererIntegrations = integrations.map((r) => `    ${r.id}(),`);
	return [
		`import { defineConfig } from 'astro/config';`,
		...rendererImports,
		`// https://astro.build/config`,
		`export default defineConfig({`,
		`  integrations: [`,
		...rendererIntegrations,
		`  ]`,
		`});`,
	].join('\n');
};
