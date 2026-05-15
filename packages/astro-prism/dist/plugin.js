function addAstro(Prism) {
	if (Prism.languages.astro) {
		return;
	}
	let scriptLang;
	if (Prism.languages.typescript) {
		scriptLang = 'typescript';
	} else {
		scriptLang = 'javascript';
		console.warn(
			'Prism TypeScript language not loaded, Astro scripts will be treated as JavaScript.',
		);
	}
	let script = Prism.util.clone(Prism.languages[scriptLang]);
	let space = /(?:\s|\/\/.*(?!.)|\/\*(?:[^*]|\*(?!\/))\*\/)/.source;
	let braces = /(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])*\})/.source;
	let spread = /(?:\{<S>*\.{3}(?:[^{}]|<BRACES>)*\})/.source;
	function re(source, flags) {
		source = source
			.replace(/<S>/g, function () {
				return space;
			})
			.replace(/<BRACES>/g, function () {
				return braces;
			})
			.replace(/<SPREAD>/g, function () {
				return spread;
			});
		return RegExp(source, flags);
	}
	spread = re(spread).source;
	Prism.languages.astro = Prism.languages.extend('markup', script);
	Prism.languages.astro.tag.pattern = re(
		/<\/?(?:[\w.:-]+(?:<S>+(?:[\w.:$-]+(?:=(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s{'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*\/?)?>/
			.source,
	);
	Prism.languages.astro.tag.inside['tag'].pattern = /^<\/?[^\s>/]*/;
	Prism.languages.astro.tag.inside['attr-value'].pattern =
		/=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/;
	Prism.languages.astro.tag.inside['tag'].inside['class-name'] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/;
	Prism.languages.astro.tag.inside['comment'] = script['comment'];
	Prism.languages.insertBefore(
		'inside',
		'attr-name',
		{
			spread: {
				pattern: re(/<SPREAD>/.source),
				inside: Prism.languages.astro,
			},
		},
		Prism.languages.astro.tag,
	);
	Prism.languages.insertBefore(
		'inside',
		'special-attr',
		{
			script: {
				// Allow for two levels of nesting
				pattern: re(/=<BRACES>/.source),
				inside: {
					'script-punctuation': {
						pattern: /^=(?=\{)/,
						alias: 'punctuation',
					},
					rest: Prism.languages.astro,
				},
				alias: `language-${scriptLang}`,
			},
		},
		Prism.languages.astro.tag,
	);
	let stringifyToken = function (token) {
		if (!token) {
			return '';
		}
		if (typeof token === 'string') {
			return token;
		}
		if (typeof token.content === 'string') {
			return token.content;
		}
		return token.content.map(stringifyToken).join('');
	};
	let walkTokens = function (tokens) {
		let openedTags = [];
		for (let i = 0; i < tokens.length; i++) {
			let token = tokens[i];
			if (token.type === 'style') {
				return;
			}
			let notTagNorBrace = false;
			if (typeof token !== 'string') {
				if (token.type === 'tag' && token.content[0] && token.content[0].type === 'tag') {
					if (token.content[0].content[0].content === '</') {
						if (
							openedTags.length > 0 &&
							openedTags[openedTags.length - 1].tagName ===
								stringifyToken(token.content[0].content[1])
						) {
							openedTags.pop();
						}
					} else {
						if (token.content[token.content.length - 1].content === '/>') {
						} else {
							openedTags.push({
								tagName: stringifyToken(token.content[0].content[1]),
								openedBraces: 0,
							});
						}
					}
				} else if (openedTags.length > 0 && token.type === 'punctuation' && token.content === '{') {
					openedTags[openedTags.length - 1].openedBraces++;
				} else if (
					openedTags.length > 0 &&
					openedTags[openedTags.length - 1].openedBraces > 0 &&
					token.type === 'punctuation' &&
					token.content === '}'
				) {
					openedTags[openedTags.length - 1].openedBraces--;
				} else {
					notTagNorBrace = true;
				}
			}
			if (notTagNorBrace || typeof token === 'string') {
				if (openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces === 0) {
					let plainText = stringifyToken(token);
					if (
						i < tokens.length - 1 &&
						(typeof tokens[i + 1] === 'string' || tokens[i + 1].type === 'plain-text')
					) {
						plainText += stringifyToken(tokens[i + 1]);
						tokens.splice(i + 1, 1);
					}
					if (i > 0 && (typeof tokens[i - 1] === 'string' || tokens[i - 1].type === 'plain-text')) {
						plainText = stringifyToken(tokens[i - 1]) + plainText;
						tokens.splice(i - 1, 1);
						i--;
					}
					tokens[i] = new Prism.Token('plain-text', plainText, void 0, plainText);
				}
			}
			if (token.content && typeof token.content !== 'string') {
				walkTokens(token.content);
			}
		}
	};
	Prism.hooks.add('after-tokenize', function (env) {
		if (env.language !== 'astro') {
			return;
		}
		walkTokens(env.tokens);
	});
}
export { addAstro };
