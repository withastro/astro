export const createConfig = ({ integrations }: { integrations: string[] }) => {
	if (integrations.length === 0) {
		return `import { defineConfig } from 'astro/config';
// https://astro.build/config
export default defineConfig({});
`;
	}

	const rendererImports = integrations.map((r: string) => `  import ${r} from '@astrojs/${r === 'solid' ? 'solid-js' : r}';`);
	const rendererIntegrations = integrations.map((r: string) => `    ${r}(),`);
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
