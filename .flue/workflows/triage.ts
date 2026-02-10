import type { Flue } from '@flue/client';
import * as v from 'valibot';

const reproductionResultSchema = v.object({
	reproducible: v.pipe(
		v.boolean(),
		v.description('true if the bug was successfully reproduced, false otherwise'),
	),
	skipped: v.pipe(
		v.boolean(),
		v.description(
			'true if reproduction was intentionally skipped (host-specific, unsupported version, etc.)',
		),
	),
});

const diagnoseResultSchema = v.object({
	confidence: v.pipe(
		v.nullable(v.picklist(['high', 'medium', 'low'])),
		v.description('Diagnosis confidence level, null if not attempted'),
	),
});

const fixResultSchema = v.object({
	fixed: v.pipe(v.boolean(), v.description('true if the bug was successfully fixed and verified')),
});

export default async function triage(flue: Flue) {
	const { issueNumber } = flue.args as {
		issueNumber: number;
	};

	const issueJson = await flue.shell(`gh issue view ${issueNumber} --json title,body`, {
		env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN },
	});
	const issue = JSON.parse(issueJson.stdout) as {
		title: string;
		body: string;
	};

	const reproduceResult = await flue.skill('triage/reproduce.md', {
		args: { issueTitle: issue.title, issueBody: issue.body },
		result: reproductionResultSchema,
	});

	const diagnoseResult = await flue.skill('triage/diagnose.md', {
		result: diagnoseResultSchema,
	});

	const fixResult = await flue.skill('triage/fix.md', {
		result: fixResultSchema,
	});

	let isPushed = false;
	if (fixResult.fixed) {
		const pushResult = await flue.shell(`git push origin HEAD:${flue.branch}`);
		isPushed = pushResult.exitCode === 0;
	}

	const branchName = isPushed ? flue.branch : null;
	const comment = await flue.skill('triage/comment.md', {
		args: { branchName },
		result: v.string(),
	});

	await flue.shell(`gh issue comment ${issueNumber} --body-file -`, {
		stdin: comment,
		env: { GH_TOKEN: flue.secrets.GITHUB_TOKEN },
	});

	return { reproduceResult, diagnoseResult, fixResult, isPushed };
}
