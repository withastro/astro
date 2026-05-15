import { Parser } from 'htmlparser2';
function htmlTokenTransform(tokenizer, tokens) {
	const output = [];
	let textBuffer = '';
	let inCDATA = false;
	const appendText = (text) => {
		textBuffer += text;
	};
	const processTextBuffer = () => {
		if (textBuffer.length > 0) {
			const toks = tokenizer.tokenize(textBuffer);
			if (toks.length === 3) {
				const first = toks[0];
				const second = toks[1];
				const third = toks.at(2);
				if (
					first.type === 'paragraph_open' &&
					second.type === 'inline' &&
					third &&
					third.type === 'paragraph_close' &&
					Array.isArray(second.children)
				) {
					for (const tok of second.children) {
						if (tok.type === 'text') {
							if (tok.content.trim() === textBuffer.trim()) {
								tok.content = textBuffer;
							}
						}
						output.push(tok);
					}
				} else {
					for (const tok of toks) {
						output.push(tok);
					}
				}
			} else {
				for (const tok of toks) {
					output.push(tok);
				}
			}
			textBuffer = '';
		}
	};
	const parser = new Parser(
		{
			oncdatastart() {
				inCDATA = true;
			},
			oncdataend() {
				inCDATA = false;
			},
			// when an HTML tag opens...
			onopentag(name, attrs) {
				processTextBuffer();
				output.push({
					type: 'tag_open',
					nesting: 1,
					meta: {
						tag: 'html-tag',
						attributes: [
							{ type: 'attribute', name: 'name', value: name },
							{ type: 'attribute', name: 'attrs', value: attrs },
						],
					},
				});
			},
			ontext(content) {
				if (inCDATA) {
					return;
				}
				if (typeof content === 'string') {
					appendText(content);
				}
			},
			// when an HTML tag closes...
			onclosetag(name) {
				processTextBuffer();
				output.push({
					type: 'tag_close',
					nesting: -1,
					meta: {
						tag: 'html-tag',
						attributes: [{ type: 'attribute', name: 'name', value: name }],
					},
				});
			},
		},
		{
			decodeEntities: false,
			recognizeCDATA: true,
			recognizeSelfClosing: true,
		},
	);
	for (const token of tokens) {
		if (token.type.startsWith('html')) {
			parser.write(token.content);
			continue;
		}
		if (token.type === 'inline') {
			if (token.children) {
				token.children = htmlTokenTransform(tokenizer, token.children);
			}
		}
		output.push(token);
	}
	processTextBuffer();
	mutateAndCollapseExtraParagraphsUnderHtml(output);
	return output;
}
function mutateAndCollapseExtraParagraphsUnderHtml(tokens) {
	let done = false;
	while (!done) {
		const idx = findExtraParagraphUnderHtml(tokens);
		if (typeof idx === 'number') {
			const actualChildTokens = tokens[idx + 2].children ?? [];
			tokens.splice(idx, 5, ...actualChildTokens);
		} else {
			done = true;
		}
	}
}
function findExtraParagraphUnderHtml(tokens) {
	if (tokens.length < 5) {
		return null;
	}
	for (let i = 0; i < tokens.length; i++) {
		const last = i + 4;
		if (last > tokens.length - 1) {
			break;
		}
		const slice = tokens.slice(i, last + 1);
		const isMatch = isExtraParagraphPatternMatch(slice);
		if (isMatch) {
			return i;
		}
	}
	return null;
}
function isExtraParagraphPatternMatch(slice) {
	const match =
		isHtmlTagOpen(slice[0]) &&
		isParagraphOpen(slice[1]) &&
		isInline(slice[2]) &&
		isParagraphClose(slice[3]) &&
		isHtmlTagClose(slice[4]);
	return match;
}
function isHtmlTagOpen(token) {
	return token.type === 'tag_open' && token.meta && token.meta.tag === 'html-tag';
}
function isHtmlTagClose(token) {
	return token.type === 'tag_close' && token.meta && token.meta.tag === 'html-tag';
}
function isParagraphOpen(token) {
	return token.type === 'paragraph_open';
}
function isParagraphClose(token) {
	return token.type === 'paragraph_close';
}
function isInline(token) {
	return token.type === 'inline';
}
export { htmlTokenTransform };
