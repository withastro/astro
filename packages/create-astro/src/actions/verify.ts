import type { Context } from './context';

import { color } from '@astrojs/cli-kit';
import dns from 'node:dns/promises';
import { bannerAbort, error, info, log } from '../messages.js';
import { getTemplateTarget } from './template.js';

export async function verify(
	ctx: Pick<Context, 'version' | 'dryRun' | 'template' | 'ref' | 'exit'>
) {
	if (!ctx.dryRun) {
		const online = await isOnline();
		if (!online) {
			bannerAbort();
			log('');
			error('error', `Unable to connect to the internet.`);
			ctx.exit(1);
		}
	}

	if (ctx.template) {
		const ok = await verifyTemplate(ctx.template, ctx.ref);
		if (!ok) {
			bannerAbort();
			log('');
			error('error', `Template ${color.reset(ctx.template)} ${color.dim('could not be found!')}`);
			await info('check', 'https://astro.build/examples');
			ctx.exit(1);
		}
	}
}

function isOnline(): Promise<boolean> {
	return dns.lookup('github.com').then(
		() => true,
		() => false
	);
}

async function verifyTemplate(tmpl: string, ref?: string) {
	const target = getTemplateTarget(tmpl, ref);
	const { repo, subdir, ref: branch } = parseGitURI(target.replace('github:', ''));
	const url = new URL(`/repos/${repo}/contents${subdir}?ref=${branch}`, 'https://api.github.com/');

	let res = await fetch(url.toString(), {
		headers: {
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
		},
	});

	// If users hit a ratelimit, fallback to the GitHub website
	if (res.status === 403) {
		res = await fetch(`https://github.com/${repo}/tree/${branch}${subdir}`);
	}

	return res.status === 200;
}

// Adapted from https://github.com/unjs/giget/blob/main/src/_utils.ts
// MIT License

// Copyright (c) Pooya Parsa <pooya@pi0.io>

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
const GIT_RE = /^(?<repo>[\w.-]+\/[\w.-]+)(?<subdir>[^#]+)?(?<ref>#[\w.-]+)?/;

function parseGitURI(input: string) {
	const m = input.match(GIT_RE)?.groups;
	if (!m) throw new Error(`Unable to parse "${input}"`);
	return {
		repo: m.repo,
		subdir: m.subdir || '/',
		ref: m.ref ? m.ref.slice(1) : 'main',
	};
}
