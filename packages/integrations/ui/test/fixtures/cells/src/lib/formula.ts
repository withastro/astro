// The formula language for 7GUIs Cells. Plain TypeScript with no DOM or
// signals, so the server (to render initial values) and the client (inside
// signals) share it.
//
//   12  3.5  hello         literals
//   =A1*2 + (B3 - 1) / 4   arithmetic on numbers and cell references
//   =sum(A1:A9, B2)        functions take ranges or expressions

export const COLS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
export const ROWS = Array.from({ length: 100 }, (_, i) => i);

export type Value = number | string;

export class FormulaError {
	constructor(readonly code: '#ERR!' | '#REF!' | '#VALUE!' | '#DIV/0!' | '#NAME?' | '#CYCLE!') {}
}

type Expr =
	| { type: 'num'; value: number }
	| { type: 'ref'; ref: string }
	| { type: 'range'; refs: string[] }
	| { type: 'neg'; arg: Expr }
	| { type: 'bin'; op: string; left: Expr; right: Expr }
	| { type: 'call'; name: string; args: Expr[] };

export type Formula =
	| { type: 'literal'; value: Value }
	| { type: 'expr'; expr: Expr }
	| { type: 'error'; error: FormulaError };

const REF_RE = /^([A-Z])(\d{1,2})$/;

function isRef(ref: string) {
	return REF_RE.test(ref);
}

function expandRange(from: string, to: string): string[] {
	const [, c1, r1] = REF_RE.exec(from)!;
	const [, c2, r2] = REF_RE.exec(to)!;
	const refs: string[] = [];
	const [cs, ce] = [c1.charCodeAt(0), c2.charCodeAt(0)].sort((a, b) => a - b);
	const [rs, re] = [Number(r1), Number(r2)].sort((a, b) => a - b);
	for (let c = cs; c <= ce; c++) for (let r = rs; r <= re; r++) refs.push(String.fromCharCode(c) + r);
	return refs;
}

const TOKEN_RE = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z]+\d*)|(.))/y;

export function parse(source: string): Formula {
	const text = source.trim();
	if (!text.startsWith('=')) {
		const n = Number(text);
		return { type: 'literal', value: text !== '' && !Number.isNaN(n) ? n : source };
	}

	const tokens: string[] = [];
	TOKEN_RE.lastIndex = 1;
	while (TOKEN_RE.lastIndex < text.length) {
		const m = TOKEN_RE.exec(text);
		if (!m) break;
		const tok = m[1] ?? m[2] ?? m[3];
		if (tok !== undefined) tokens.push(m[2] ? tok.toUpperCase() : tok);
	}
	let i = 0;
	const peek = () => tokens[i];
	const take = (expected?: string) => {
		const t = tokens[i++];
		if (expected !== undefined && t !== expected) throw new FormulaError('#ERR!');
		if (t === undefined) throw new FormulaError('#ERR!');
		return t;
	};

	const expr = (): Expr => {
		let left = term();
		while (peek() === '+' || peek() === '-') left = { type: 'bin', op: take(), left, right: term() };
		return left;
	};
	const term = (): Expr => {
		let left = factor();
		while (peek() === '*' || peek() === '/') left = { type: 'bin', op: take(), left, right: factor() };
		return left;
	};
	const factor = (): Expr => {
		const t = take();
		if (t === '-') return { type: 'neg', arg: factor() };
		if (t === '(') {
			const e = expr();
			take(')');
			return e;
		}
		if (/^\d/.test(t)) return { type: 'num', value: Number(t) };
		if (isRef(t)) return { type: 'ref', ref: t };
		if (/^[A-Z]+$/.test(t) && peek() === '(') {
			take('(');
			const args: Expr[] = [];
			if (peek() !== ')') {
				do args.push(arg());
				while (peek() === ',' && take());
			}
			take(')');
			return { type: 'call', name: t.toLowerCase(), args };
		}
		throw new FormulaError(/^[A-Z]/.test(t) ? '#REF!' : '#ERR!');
	};
	const arg = (): Expr => {
		if (isRef(peek()) && tokens[i + 1] === ':') {
			const from = take();
			take(':');
			const to = take();
			if (!isRef(to)) throw new FormulaError('#REF!');
			return { type: 'range', refs: expandRange(from, to) };
		}
		return expr();
	};

	try {
		const e = expr();
		if (i !== tokens.length) throw new FormulaError('#ERR!');
		return { type: 'expr', expr: e };
	} catch (error) {
		if (!(error instanceof FormulaError)) throw error;
		return { type: 'error', error };
	}
}

/** Every cell a formula reads, for dependency and cycle tracking. */
export function references(formula: Formula): string[] {
	if (formula.type !== 'expr') return [];
	const out: string[] = [];
	const visit = (e: Expr) => {
		if (e.type === 'ref') out.push(e.ref);
		else if (e.type === 'range') out.push(...e.refs);
		else if (e.type === 'neg') visit(e.arg);
		else if (e.type === 'bin') {
			visit(e.left);
			visit(e.right);
		} else if (e.type === 'call') e.args.forEach(visit);
	};
	visit(formula.expr);
	return out;
}

const FUNCTIONS: Record<string, (xs: number[]) => number> = {
	sum: (xs) => xs.reduce((a, b) => a + b, 0),
	avg: (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0),
	min: (xs) => (xs.length ? Math.min(...xs) : 0),
	max: (xs) => (xs.length ? Math.max(...xs) : 0),
	count: (xs) => xs.length,
};

/**
 * Evaluates a formula. `get` returns another cell's value and throws a
 * FormulaError if that cell has one, so errors propagate.
 */
export function evaluate(formula: Formula, get: (ref: string) => Value): Value {
	if (formula.type === 'literal') return formula.value;
	if (formula.type === 'error') throw formula.error;

	const num = (v: Value) => {
		if (v === '') return 0;
		if (typeof v !== 'number') throw new FormulaError('#VALUE!');
		return v;
	};
	const run = (e: Expr): number => {
		switch (e.type) {
			case 'num':
				return e.value;
			case 'ref':
				return num(get(e.ref));
			case 'neg':
				return -run(e.arg);
			case 'bin': {
				const [l, r] = [run(e.left), run(e.right)];
				if (e.op === '+') return l + r;
				if (e.op === '-') return l - r;
				if (e.op === '*') return l * r;
				if (r === 0) throw new FormulaError('#DIV/0!');
				return l / r;
			}
			case 'call': {
				const fn = FUNCTIONS[e.name];
				if (!fn) throw new FormulaError('#NAME?');
				const xs: number[] = [];
				for (const a of e.args) {
					if (a.type !== 'range') xs.push(run(a));
					// Ranges skip blanks and text, like a spreadsheet.
					else for (const ref of a.refs) {
						const v = get(ref);
						if (typeof v === 'number') xs.push(v);
					}
				}
				return fn(xs);
			}
			case 'range':
				throw new FormulaError('#VALUE!');
		}
	};
	return run(formula.expr);
}

export function display(value: Value | FormulaError | undefined): string {
	if (value === undefined) return '';
	if (value instanceof FormulaError) return value.code;
	if (typeof value === 'number') return String(Math.round(value * 1e6) / 1e6);
	return value;
}

/**
 * Evaluates a whole sheet once, for server rendering. The client does the
 * same thing with one computed signal per cell.
 */
export function evaluateSheet(sources: Record<string, string>): Record<string, Value | FormulaError> {
	const parsed = new Map(Object.entries(sources).map(([ref, src]) => [ref, parse(src)]));
	const values: Record<string, Value | FormulaError> = {};
	const evaluating = new Set<string>();
	const get = (ref: string): Value => {
		if (!(ref in values)) {
			if (evaluating.has(ref)) throw new FormulaError('#CYCLE!');
			evaluating.add(ref);
			const f = parsed.get(ref);
			try {
				values[ref] = f ? evaluate(f, get) : '';
			} catch (e) {
				if (!(e instanceof FormulaError)) throw e;
				values[ref] = e;
			}
			evaluating.delete(ref);
		}
		const v = values[ref];
		if (v instanceof FormulaError) throw v;
		return v;
	};
	for (const ref of parsed.keys()) {
		try {
			get(ref);
		} catch {}
	}
	return values;
}
