import fs from 'node:fs';
import path from 'node:path';
import { assign, parse, stringify } from 'comment-json';

export default async function setupTypeScript(value: string, { cwd }: { cwd: string }) {
	if (value === 'default') return;
	const templateTSConfigPath = path.join(cwd, 'tsconfig.json');
	fs.readFile(templateTSConfigPath, (err, data) => {
		if (err && err.code === 'ENOENT') {
			// If the template doesn't have a tsconfig.json, let's add one instead
			fs.writeFileSync(
				templateTSConfigPath,
				stringify({ extends: `astro/tsconfigs/${value}` }, null, 2)
			);

			return;
		}

		const templateTSConfig = parse(data.toString());

		if (templateTSConfig && typeof templateTSConfig === 'object') {
			const result = assign(templateTSConfig, {
				extends: `astro/tsconfigs/${value}`,
			});

			fs.writeFileSync(templateTSConfigPath, stringify(result, null, 2));
		} else {
			throw new Error("There was an error applying the requested TypeScript settings. This could be because the template's tsconfig.json is malformed")
		}
	});
}
