/* eslint no-console: 'off' */
import { isEmpty } from "./shared.js";
import { info } from "../messages.js";
import { color } from "@astrojs/cli-kit";

export default async function checkCwd(cwd: string | undefined) {
	const empty = cwd && isEmpty(cwd);
	if (empty) {
		console.log('');
		await info('dir', `Using ${color.reset(cwd)}${color.dim(' as project directory')}`);
	}

	return empty;
}
