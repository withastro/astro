import { type Reporter, reporterNames } from './reporters.js';

export type ReportTarget = {
	reporter: Reporter;
	reporterFile?: string;
};

export type ReportOptions = {
	reporter?: Reporter;
	reporterFile?: string;
	reporters?: readonly ReportTarget[];
};

/** Group adjacent reporter options after the CLI parser has validated option values. */
export function parseReportTargets(args: readonly string[]): ReportTarget[] {
	const targets: ReportTarget[] = [];
	let pending: Partial<ReportTarget> | undefined;
	function finishTarget() {
		if (pending !== undefined) {
			targets.push({ reporter: 'default', ...pending });
			pending = undefined;
		}
	}

	for (let index = 0; index < args.length; index++) {
		const argument = args[index];
		if (argument === '--') break;
		const equals = argument.indexOf('=');
		const option = equals === -1 ? argument : argument.slice(0, equals);
		if (option !== '--reporter' && option !== '--reporter-file' && option !== '--reporterFile') {
			finishTarget();
			continue;
		}

		const value = equals === -1 ? args[++index] : argument.slice(equals + 1);
		if (value === undefined) {
			throw new Error(`${option} requires a value.`);
		}
		const key = option === '--reporter' ? 'reporter' : 'reporterFile';
		if (pending?.[key] !== undefined) finishTarget();
		pending ??= {};
		if (key === 'reporter') pending.reporter = parseReporter(value);
		else pending.reporterFile = value;
	}
	finishTarget();
	return resolveReportTargets(targets.length === 0 ? {} : { reporters: targets });
}

export function resolveReportTargets({
	reporter,
	reporterFile,
	reporters,
}: ReportOptions): ReportTarget[] {
	if (reporters !== undefined && (reporter !== undefined || reporterFile !== undefined)) {
		throw new Error('Use either reporters or reporter/reporterFile, not both.');
	}
	const targets = reporters ?? [{ reporter: reporter ?? 'default', reporterFile }];
	if (targets.length === 0) throw new Error('At least one reporter is required.');
	return targets.map((target) => {
		const reporterName = parseReporter(target.reporter);
		if (target.reporterFile === undefined) return { reporter: reporterName };
		if (typeof target.reporterFile !== 'string' || target.reporterFile.length === 0) {
			throw new Error('reporterFile must be a non-empty file path.');
		}
		return { reporter: reporterName, reporterFile: target.reporterFile };
	});
}

function parseReporter(value: string): Reporter {
	const reporter = reporterNames.find((name) => name === value);
	if (reporter === undefined) {
		throw new Error(`Unknown reporter "${value}". Choose one of: ${reporterNames.join(', ')}.`);
	}
	return reporter;
}
