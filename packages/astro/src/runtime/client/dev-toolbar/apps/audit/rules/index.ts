import { a11y } from './a11y.js';
import { perf } from './perf.js';

type DynamicString = string | ((element: Element) => string);

export interface AuditRule {
	code: string;
	title: DynamicString;
	message: DynamicString;
}

export interface ResolvedAuditRule {
	code: string;
	title: string;
	message: string;
}

export interface AuditRuleWithSelector extends AuditRule {
	selector: string;
	match?: (
		element: Element
	) =>
		| boolean
		| null
		| undefined
		| void
		| Promise<boolean>
		| Promise<void>
		| Promise<null>
		| Promise<undefined>;
}

export const rules = [...a11y, ...perf];

const dynamicAuditRuleKeys: Array<keyof AuditRule> = ['title', 'message'];

export function resolveAuditRule(rule: AuditRule, element: Element): ResolvedAuditRule {
	let resolved: ResolvedAuditRule = { ...rule } as any;
	for (const key of dynamicAuditRuleKeys) {
		const value = rule[key];
		if (typeof value === 'string') continue;
		try {
			resolved[key] = value(element);
		} catch (err) {
			console.error(`Error resolving dynamic audit rule ${rule.code}'s ${key}:`, err);
			resolved[key] = 'Error resolving dynamic rule';
		}
	}
	return resolved;
}
