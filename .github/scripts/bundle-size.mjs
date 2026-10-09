import { existsSync } from 'node:fs';
import { rolldown } from 'rolldown';

const CLIENT_RUNTIME_PATH = 'packages/astro/src/runtime/client/';

function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default async function checkBundleSize({ github, context }) {
	const PR_NUM = context.payload.pull_request.number;
	const SHA = context.payload.pull_request.head.sha;

	const { data: files } = await github.rest.pulls.listFiles({
		...context.repo,
		pull_number: PR_NUM,
	});
	const clientRuntimeFiles = files.filter((file) => {
		return file.filename.startsWith(CLIENT_RUNTIME_PATH) && file.status !== 'removed';
	});
	if (clientRuntimeFiles.length === 0) return;

	const table = [
		'| File | Old Size | New Size | Change |',
		'| ---- | -------- | -------- | ------ |',
	];
	const output = await bundle(clientRuntimeFiles);

	for (let [filename, { oldSize, newSize, sourceFile }] of Object.entries(output)) {
		filename = ['idle', 'load', 'media', 'only', 'visible'].includes(filename)
			? `client:${filename}`
			: filename;
		const prefix = newSize - oldSize === 0 ? '' : newSize - oldSize > 0 ? '+ ' : '- ';
		const change = `${prefix}${formatBytes(newSize - oldSize)}`;
		table.push(
			`| [\`${filename}\`](https://github.com/${context.repo.owner}/${context.repo.repo}/tree/${context.payload.pull_request.head.ref}/${sourceFile}) | ${formatBytes(oldSize)} | ${formatBytes(newSize)} | ${change} |`,
		);
	}

	const { data: comments } = await github.rest.issues.listComments({
		...context.repo,
		issue_number: PR_NUM,
	});
	const comment = comments.find(
		(comment) =>
			comment.user.login === 'github-actions[bot]' && comment.body.includes('Bundle Size Check'),
	);
	const method = comment ? 'updateComment' : 'createComment';
	const payload = comment ? { comment_id: comment.id } : { issue_number: PR_NUM };
	await github.rest.issues[method]({
		...context.repo,
		...payload,
		body: `###  ⚖️  Bundle Size Check

Latest commit: ${SHA}

${table.join('\n')}`,
	});
}

async function bundle(files) {
	const entryPoints = [
		...files.map(({ filename }) => filename),
		...files.map(({ filename }) => `main/${filename}`).filter((f) => existsSync(f)),
	];

	const sizes = {};
	for (const entryPoint of entryPoints) {
		const isOld = entryPoint.startsWith('main/');
		const name = entryPoint.replace(/\.[^.]+$/, '');
		const bundle = await rolldown({
			input: { [name]: entryPoint },
			platform: 'browser',
			external: (id) =>
				id.startsWith('astro:') ||
				id === 'aria-query' ||
				id.startsWith('aria-query/') ||
				id === 'axobject-query' ||
				id.startsWith('axobject-query/'),
			transform: { target: 'esnext' },
		});

		try {
			const { output } = await bundle.generate({
				format: 'esm',
				minify: true,
				codeSplitting: false,
				entryFileNames: '[name].js',
			});
			const chunk = output.find((item) => item.type === 'chunk');
			if (!chunk) continue;

			const filename = entryPoint
				.replace(/^main\//, '')
				.replace(CLIENT_RUNTIME_PATH, '')
				.replace(/\.[^.]+$/, '');
			const size = Buffer.byteLength(chunk.code);
			const entry = (sizes[filename] ??= { oldSize: 0, newSize: 0 });
			if (isOld) {
				entry.oldSize = size;
			} else {
				entry.newSize = size;
				entry.sourceFile = entryPoint;
			}
		} finally {
			await bundle.close();
		}
	}

	return sizes;
}
