import { BUNDLED_LANGUAGES } from 'shiki';

export const languages = {
	abap: () =>
		import('shiki/languages/abap.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'abap');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'actionscript-3': () =>
		import('shiki/languages/actionscript-3.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'actionscript-3');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	ada: () =>
		import('shiki/languages/ada.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'ada');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	apache: () =>
		import('shiki/languages/apache.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'apache');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	apex: () =>
		import('shiki/languages/apex.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'apex');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	apl: () =>
		import('shiki/languages/apl.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'apl');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	applescript: () =>
		import('shiki/languages/applescript.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'applescript');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	asm: () =>
		import('shiki/languages/asm.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'asm');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	astro: () =>
		import('shiki/languages/astro.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'astro');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	awk: () =>
		import('shiki/languages/awk.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'awk');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	ballerina: () =>
		import('shiki/languages/ballerina.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'ballerina');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	bat: () =>
		import('shiki/languages/bat.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'bat');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	berry: () =>
		import('shiki/languages/berry.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'berry');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	bibtex: () =>
		import('shiki/languages/bibtex.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'bibtex');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	bicep: () =>
		import('shiki/languages/bicep.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'bicep');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	blade: () =>
		import('shiki/languages/blade.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'blade');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	c: () =>
		import('shiki/languages/c.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'c');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	cadence: () =>
		import('shiki/languages/cadence.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'cadence');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	clarity: () =>
		import('shiki/languages/clarity.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'clarity');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	clojure: () =>
		import('shiki/languages/clojure.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'clojure');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	cmake: () =>
		import('shiki/languages/cmake.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'cmake');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	cobol: () =>
		import('shiki/languages/cobol.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'cobol');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	codeql: () =>
		import('shiki/languages/codeql.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'codeql');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	coffee: () =>
		import('shiki/languages/coffee.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'coffee');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'cpp-macro': () =>
		import('shiki/languages/cpp-macro.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'cpp-macro');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	cpp: () =>
		import('shiki/languages/cpp.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'cpp');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	crystal: () =>
		import('shiki/languages/crystal.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'crystal');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	csharp: () =>
		import('shiki/languages/csharp.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'csharp');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	css: () =>
		import('shiki/languages/css.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'css');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	cue: () =>
		import('shiki/languages/cue.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'cue');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	d: () =>
		import('shiki/languages/d.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'd');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	dart: () =>
		import('shiki/languages/dart.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'dart');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	diff: () =>
		import('shiki/languages/diff.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'diff');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	docker: () =>
		import('shiki/languages/docker.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'docker');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'dream-maker': () =>
		import('shiki/languages/dream-maker.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'dream-maker');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	elixir: () =>
		import('shiki/languages/elixir.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'elixir');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	elm: () =>
		import('shiki/languages/elm.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'elm');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	erb: () =>
		import('shiki/languages/erb.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'erb');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	erlang: () =>
		import('shiki/languages/erlang.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'erlang');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	fish: () =>
		import('shiki/languages/fish.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'fish');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	fsharp: () =>
		import('shiki/languages/fsharp.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'fsharp');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	gherkin: () =>
		import('shiki/languages/gherkin.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'gherkin');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'git-commit': () =>
		import('shiki/languages/git-commit.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'git-commit');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'git-rebase': () =>
		import('shiki/languages/git-rebase.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'git-rebase');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	glsl: () =>
		import('shiki/languages/glsl.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'glsl');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	gnuplot: () =>
		import('shiki/languages/gnuplot.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'gnuplot');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	go: () =>
		import('shiki/languages/go.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'go');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	graphql: () =>
		import('shiki/languages/graphql.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'graphql');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	groovy: () =>
		import('shiki/languages/groovy.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'groovy');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	hack: () =>
		import('shiki/languages/hack.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'hack');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	haml: () =>
		import('shiki/languages/haml.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'haml');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	handlebars: () =>
		import('shiki/languages/handlebars.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'handlebars');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	haskell: () =>
		import('shiki/languages/haskell.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'haskell');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	hcl: () =>
		import('shiki/languages/hcl.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'hcl');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	hlsl: () =>
		import('shiki/languages/hlsl.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'hlsl');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	html: () =>
		import('shiki/languages/html.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'html');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	ini: () =>
		import('shiki/languages/ini.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'ini');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	java: () =>
		import('shiki/languages/java.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'java');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	javascript: () =>
		import('shiki/languages/javascript.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'javascript');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'jinja-html': () =>
		import('shiki/languages/jinja-html.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'jinja-html');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	jinja: () =>
		import('shiki/languages/jinja.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'jinja');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	json: () =>
		import('shiki/languages/json.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'json');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	jsonc: () =>
		import('shiki/languages/jsonc.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'jsonc');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	jsonnet: () =>
		import('shiki/languages/jsonnet.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'jsonnet');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	jssm: () =>
		import('shiki/languages/jssm.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'jssm');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	jsx: () =>
		import('shiki/languages/jsx.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'jsx');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	julia: () =>
		import('shiki/languages/julia.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'julia');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	kotlin: () =>
		import('shiki/languages/kotlin.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'kotlin');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	latex: () =>
		import('shiki/languages/latex.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'latex');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	less: () =>
		import('shiki/languages/less.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'less');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	liquid: () =>
		import('shiki/languages/liquid.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'liquid');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	lisp: () =>
		import('shiki/languages/lisp.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'lisp');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	logo: () =>
		import('shiki/languages/logo.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'logo');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	lua: () =>
		import('shiki/languages/lua.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'lua');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	make: () =>
		import('shiki/languages/make.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'make');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	markdown: () =>
		import('shiki/languages/markdown.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'markdown');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	marko: () =>
		import('shiki/languages/marko.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'marko');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	matlab: () =>
		import('shiki/languages/matlab.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'matlab');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	mdx: () =>
		import('shiki/languages/mdx.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'mdx');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	mermaid: () =>
		import('shiki/languages/mermaid.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'mermaid');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	nginx: () =>
		import('shiki/languages/nginx.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'nginx');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	nim: () =>
		import('shiki/languages/nim.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'nim');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	nix: () =>
		import('shiki/languages/nix.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'nix');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'objective-c': () =>
		import('shiki/languages/objective-c.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'objective-c');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'objective-cpp': () =>
		import('shiki/languages/objective-cpp.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'objective-cpp');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	ocaml: () =>
		import('shiki/languages/ocaml.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'ocaml');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	pascal: () =>
		import('shiki/languages/pascal.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'pascal');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	perl: () =>
		import('shiki/languages/perl.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'perl');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'php-html': () =>
		import('shiki/languages/php-html.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'php-html');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	php: () =>
		import('shiki/languages/php.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'php');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	plsql: () =>
		import('shiki/languages/plsql.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'plsql');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	postcss: () =>
		import('shiki/languages/postcss.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'postcss');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	powershell: () =>
		import('shiki/languages/powershell.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'powershell');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	prisma: () =>
		import('shiki/languages/prisma.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'prisma');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	prolog: () =>
		import('shiki/languages/prolog.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'prolog');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	pug: () =>
		import('shiki/languages/pug.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'pug');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	puppet: () =>
		import('shiki/languages/puppet.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'puppet');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	purescript: () =>
		import('shiki/languages/purescript.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'purescript');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	python: () =>
		import('shiki/languages/python.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'python');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	r: () =>
		import('shiki/languages/r.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'r');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	raku: () =>
		import('shiki/languages/raku.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'raku');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	razor: () =>
		import('shiki/languages/razor.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'razor');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	rel: () =>
		import('shiki/languages/rel.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'rel');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	riscv: () =>
		import('shiki/languages/riscv.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'riscv');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	rst: () =>
		import('shiki/languages/rst.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'rst');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	ruby: () =>
		import('shiki/languages/ruby.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'ruby');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	rust: () =>
		import('shiki/languages/rust.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'rust');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	sas: () =>
		import('shiki/languages/sas.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'sas');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	sass: () =>
		import('shiki/languages/sass.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'sass');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	scala: () =>
		import('shiki/languages/scala.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'scala');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	scheme: () =>
		import('shiki/languages/scheme.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'scheme');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	scss: () =>
		import('shiki/languages/scss.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'scss');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	shaderlab: () =>
		import('shiki/languages/shaderlab.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'shaderlab');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	shellscript: () =>
		import('shiki/languages/shellscript.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'shellscript');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	smalltalk: () =>
		import('shiki/languages/smalltalk.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'smalltalk');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	solidity: () =>
		import('shiki/languages/solidity.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'solidity');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	sparql: () =>
		import('shiki/languages/sparql.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'sparql');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	sql: () =>
		import('shiki/languages/sql.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'sql');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'ssh-config': () =>
		import('shiki/languages/ssh-config.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'ssh-config');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	stata: () =>
		import('shiki/languages/stata.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'stata');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	stylus: () =>
		import('shiki/languages/stylus.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'stylus');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	svelte: () =>
		import('shiki/languages/svelte.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'svelte');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	swift: () =>
		import('shiki/languages/swift.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'swift');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'system-verilog': () =>
		import('shiki/languages/system-verilog.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'system-verilog');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	tasl: () =>
		import('shiki/languages/tasl.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'tasl');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	tcl: () =>
		import('shiki/languages/tcl.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'tcl');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	tex: () =>
		import('shiki/languages/tex.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'tex');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	toml: () =>
		import('shiki/languages/toml.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'toml');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	tsx: () =>
		import('shiki/languages/tsx.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'tsx');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	turtle: () =>
		import('shiki/languages/turtle.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'turtle');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	twig: () =>
		import('shiki/languages/twig.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'twig');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	typescript: () =>
		import('shiki/languages/typescript.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'typescript');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	vb: () =>
		import('shiki/languages/vb.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'vb');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	verilog: () =>
		import('shiki/languages/verilog.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'verilog');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	vhdl: () =>
		import('shiki/languages/vhdl.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'vhdl');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	viml: () =>
		import('shiki/languages/viml.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'viml');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	'vue-html': () =>
		import('shiki/languages/vue-html.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'vue-html');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	vue: () =>
		import('shiki/languages/vue.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'vue');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	wasm: () =>
		import('shiki/languages/wasm.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'wasm');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	wenyan: () =>
		import('shiki/languages/wenyan.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'wenyan');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	xml: () =>
		import('shiki/languages/xml.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'xml');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	xsl: () =>
		import('shiki/languages/xsl.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'xsl');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	yaml: () =>
		import('shiki/languages/yaml.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'yaml');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
	zenscript: () =>
		import('shiki/languages/zenscript.tmLanguage.json')
			.then((mod) => mod.default)
			.then((grammar) => {
				const lang = BUNDLED_LANGUAGES.find((l) => l.id === 'zenscript');
				if (lang) {
					return {
						...lang,
						grammar,
					};
				} else {
					return undefined;
				}
			}),
};
