type DynamicString = string | ((element: Element) => string);
export interface AuditRule {
	code: string;
	title: DynamicString;
	message: DynamicString;
	description?: DynamicString;
}
export interface ResolvedAuditRule {
	code: string;
	title: string;
	message: string;
	description?: string;
}
export interface AuditRuleWithSelector extends AuditRule {
	selector: string;
	match?: (
		element: Element,
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
export declare const rulesCategories: (
	| {
			code: string;
			name: string;
			icon: 'person-arms-spread';
			rules: AuditRuleWithSelector[];
	  }
	| {
			code: string;
			name: string;
			icon: 'gauge';
			rules: AuditRuleWithSelector[];
	  }
)[];
export declare function resolveAuditRule(rule: AuditRule, element: Element): ResolvedAuditRule;
export declare function getAuditCategory(rule: AuditRule): 'perf' | 'a11y';
export declare const categoryLabel: {
	perf: string;
	a11y: string;
};
export {};
