import { codeFrame } from './printer.js';
function isAstroError(e) {
	return e != null && (e instanceof AstroError || AstroError.is(e));
}
class AstroError extends Error {
	loc;
	title;
	hint;
	frame;
	type = 'AstroError';
	constructor(props, options) {
		const { name, title, message, stack, location, hint, frame } = props;
		super(message, options);
		this.title = title;
		this.name = name;
		if (message) this.message = message;
		this.stack = stack ? stack : this.stack;
		this.loc = location;
		this.hint = hint;
		this.frame = frame;
	}
	setLocation(location) {
		this.loc = location;
	}
	setName(name) {
		this.name = name;
	}
	setMessage(message) {
		this.message = message;
	}
	setHint(hint) {
		this.hint = hint;
	}
	setFrame(source, location) {
		this.frame = codeFrame(source, location);
	}
	static is(err) {
		return err?.type === 'AstroError';
	}
}
class CompilerError extends AstroError {
	type = 'CompilerError';
	constructor(props, options) {
		super(props, options);
	}
	static is(err) {
		return err?.type === 'CompilerError';
	}
}
class CSSError extends AstroError {
	type = 'CSSError';
	static is(err) {
		return err?.type === 'CSSError';
	}
}
class MarkdownError extends AstroError {
	type = 'MarkdownError';
	static is(err) {
		return err?.type === 'MarkdownError';
	}
}
class InternalError extends AstroError {
	type = 'InternalError';
	static is(err) {
		return err?.type === 'InternalError';
	}
}
class AggregateError extends AstroError {
	type = 'AggregateError';
	errors;
	// Despite being a collection of errors, AggregateError still needs to have a main error attached to it
	// This is because Vite expects every thrown errors handled during HMR to be, well, Error and have a message
	constructor(props, options) {
		super(props, options);
		this.errors = props.errors;
	}
	static is(err) {
		return err?.type === 'AggregateError';
	}
}
const astroConfigZodErrors = /* @__PURE__ */ new WeakSet();
function isAstroConfigZodError(error) {
	return astroConfigZodErrors.has(error);
}
function trackAstroConfigZodError(error) {
	astroConfigZodErrors.add(error);
}
class AstroUserError extends Error {
	type = 'AstroUserError';
	/**
	 * A message that explains to the user how they can fix the error.
	 */
	hint;
	name = 'AstroUserError';
	constructor(message, hint) {
		super();
		this.message = message;
		this.hint = hint;
	}
	static is(err) {
		return err?.type === 'AstroUserError';
	}
}
export {
	AggregateError,
	AstroError,
	AstroUserError,
	CSSError,
	CompilerError,
	InternalError,
	MarkdownError,
	isAstroConfigZodError,
	isAstroError,
	trackAstroConfigZodError,
};
