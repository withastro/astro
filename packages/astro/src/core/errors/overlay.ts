import type { AstroErrorPayload } from './dev/vite';

const style = /* css */ `
* {
  box-sizing: border-box;
}

:host {
  /** Needed so Playwright can find the element */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99999;

  /* Fonts */
  --font-normal: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
    "Helvetica Neue", Arial, sans-serif;
  --font-monospace: ui-monospace, Menlo, Monaco, "Cascadia Mono",
    "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace",
    "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace;

  /* Borders */
  --roundiness: 4px;

  /* Colors */
  --background: #ffffff;
  --error-text: #ba1212;
  --error-text-hover: #a10000;
  --title-text: #090b11;
  --box-background: #f3f4f7;
  --box-background-hover: #dadbde;
  --hint-text: #505d84;
  --hint-text-hover: #37446b;
  --border: #c3cadb;
  --accent: #5f11a6;
  --accent-hover: #792bc0;
  --stack-text: #3d4663;
  --misc-text: #6474a2;

  --houston-overlay: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 3.95%,
    rgba(255, 255, 255, 0.0086472) 9.68%,
    rgba(255, 255, 255, 0.03551) 15.4%,
    rgba(255, 255, 255, 0.0816599) 21.13%,
    rgba(255, 255, 255, 0.147411) 26.86%,
    rgba(255, 255, 255, 0.231775) 32.58%,
    rgba(255, 255, 255, 0.331884) 38.31%,
    rgba(255, 255, 255, 0.442691) 44.03%,
    rgba(255, 255, 255, 0.557309) 49.76%,
    rgba(255, 255, 255, 0.668116) 55.48%,
    rgba(255, 255, 255, 0.768225) 61.21%,
    rgba(255, 255, 255, 0.852589) 66.93%,
    rgba(255, 255, 255, 0.91834) 72.66%,
    rgba(255, 255, 255, 0.96449) 78.38%,
    rgba(255, 255, 255, 0.991353) 84.11%,
    #ffffff 89.84%
  );

  /* Syntax Highlighting */
  --shiki-color-text: #000000;
  --shiki-token-constant: #4ca48f;
  --shiki-token-string: #9f722a;
  --shiki-token-comment: #8490b5;
  --shiki-token-keyword: var(--accent);
  --shiki-token-parameter: #aa0000;
  --shiki-token-function: #4ca48f;
  --shiki-token-string-expression: #9f722a;
  --shiki-token-punctuation: #ffffff;
  --shiki-token-link: #ee0000;
}

@media (prefers-color-scheme: dark) {
  :host {
    --background: #090b11;
    --error-text: #f49090;
    --error-text-hover: #ffaaaa;
    --title-text: #ffffff;
    --box-background: #141925;
    --box-background-hover: #2e333f;
    --hint-text: #a3acc8;
    --hint-text-hover: #bdc6e2;
    --border: #283044;
    --accent: #c490f4;
    --accent-hover: #deaaff;
    --stack-text: #c3cadb;
    --misc-text: #8490b5;

    --houston-overlay: linear-gradient(
      180deg,
      rgba(9, 11, 17, 0) 3.95%,
      rgba(9, 11, 17, 0.0086472) 9.68%,
      rgba(9, 11, 17, 0.03551) 15.4%,
      rgba(9, 11, 17, 0.0816599) 21.13%,
      rgba(9, 11, 17, 0.147411) 26.86%,
      rgba(9, 11, 17, 0.231775) 32.58%,
      rgba(9, 11, 17, 0.331884) 38.31%,
      rgba(9, 11, 17, 0.442691) 44.03%,
      rgba(9, 11, 17, 0.557309) 49.76%,
      rgba(9, 11, 17, 0.668116) 55.48%,
      rgba(9, 11, 17, 0.768225) 61.21%,
      rgba(9, 11, 17, 0.852589) 66.93%,
      rgba(9, 11, 17, 0.91834) 72.66%,
      rgba(9, 11, 17, 0.96449) 78.38%,
      rgba(9, 11, 17, 0.991353) 84.11%,
      #090b11 89.84%
    );

    /* Syntax Highlighting */
    --shiki-color-text: #ffffff;
    --shiki-token-constant: #90f4e3;
    --shiki-token-string: #f4cf90;
    --shiki-token-comment: #8490b5;
    --shiki-token-keyword: var(--accent);
    --shiki-token-parameter: #aa0000;
    --shiki-token-function: #90f4e3;
    --shiki-token-string-expression: #f4cf90;
    --shiki-token-punctuation: #ffffff;
    --shiki-token-link: #ee0000;
  }
}

#backdrop {
  font-family: var(--font-monospace);
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--background);
  overflow-y: auto;
}

#layout {
  max-width: min(100%, 1280px);
  width: 1280px;
  margin: 0 auto;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 768px) {
  #header {
    padding: 12px;
    margin-top: 12px;
  }

  #layout {
    padding: 0;
  }
}

@media (max-width: 1024px) {
  #houston,
  #houston-overlay {
    display: none;
  }
}

#header {
  position: relative;
  margin-top: 48px;
}

#header-left {
  min-height: 63px;
  display: flex;
  flex-direction: column;
  justify-content: end;
}

#name {
  font-size: 18px;
  font-weight: normal;
  line-height: 22px;
  color: var(--error-text);
  margin: 0;
  padding: 0;
}

#title {
  font-size: 34px;
  line-height: 41px;
  font-weight: 600;
  margin: 0;
  padding: 0;
  color: var(--title-text);
  font-family: var(--font-normal);
}

#houston {
  position: absolute;
  bottom: -50px;
  right: 32px;
  z-index: -50;
  color: var(--error-text);
}

#houston-overlay {
  width: 175px;
  height: 250px;
  position: absolute;
  bottom: -100px;
  right: 32px;
  z-index: -25;
  background: var(--houston-overlay);
}

#message-hints,
#stack,
#code {
  border-radius: var(--roundiness);
  background-color: var(--box-background);
}

#message,
#hint {
  display: flex;
  padding: 16px;
  gap: 16px;
}

#message-content,
#hint-content {
  white-space: pre-line;
  line-height: 24px;
  flex-grow: 1;
}

#message {
  color: var(--error-text);
}

#message-content a {
  color: var(--error-text);
}

#message-content a:hover {
  color: var(--error-text-hover);
}

#hint {
  color: var(--hint-text);
  border-top: 1px solid var(--border);
  display: none;
}

#hint a {
  color: var(--hint-text);
}

#hint a:hover {
  color: var(--hint-text-hover);
}

#message-hints code {
  font-family: var(--font-monospace);
  background-color: var(--border);
  padding: 4px;
  border-radius: var(--roundiness);
}

.link {
  min-width: fit-content;
  padding-right: 8px;
  padding-top: 8px;
}

.link button {
	background: none;
	border: none;
	font-size: inherit;
	font-family: inherit;
}

.link a, .link button {
  color: var(--accent);
  text-decoration: none;
  display: flex;
  gap: 8px;
}

.link a:hover, .link button:hover {
  color: var(--accent-hover);
  text-decoration: underline;
  cursor: pointer;
}

.link svg {
  vertical-align: text-top;
}

#code {
  display: none;
}

#code header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
}

#code h2 {
  font-family: var(--font-monospace);
  color: var(--title-text);
  font-size: 18px;
  margin: 0;
}

#code .link {
  padding: 0;
}

.shiki {
  margin: 0;
  border-top: 1px solid var(--border);
  max-height: 17rem;
  overflow: auto;
}

.shiki code {
  font-family: var(--font-monospace);
  counter-reset: step;
  counter-increment: step 0;
  font-size: 14px;
  line-height: 21px;
  tab-size: 1;
}

.shiki code .line:not(.error-caret)::before {
  content: counter(step);
  counter-increment: step;
  width: 1rem;
  margin-right: 16px;
  display: inline-block;
  text-align: right;
  padding: 0 8px;
  color: var(--misc-text);
  border-right: solid 1px var(--border);
}

.shiki code .line:first-child::before {
  padding-top: 8px;
}

.shiki code .line:last-child::before {
  padding-bottom: 8px;
}

.error-line {
  background-color: #f4909026;
  display: inline-block;
  width: 100%;
}

.error-caret {
  margin-left: calc(33px + 1rem);
  color: var(--error-text);
}

#stack h2 {
  color: var(--title-text);
  font-family: var(--font-normal);
  font-size: 22px;
  margin: 0;
  padding: 24px;
  border-bottom: 1px solid var(--border);
}

#stack-content {
  font-size: 14px;
  white-space: pre;
  line-height: 21px;
  overflow: auto;
  padding: 24px;
  color: var(--stack-text);
}
`;

const overlayTemplate = /* html */ `
<style>
${style.trim()}
</style>
<div id="backdrop">
  <div id="layout">
    <header id="header">
      <section id="header-left">
        <h2 id="name"></h2>
        <h1 id="title">An error occurred.</h1>
      </section>
      <div id="houston-overlay"></div>
      <div id="houston">
<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="175" height="131" fill="none"><path fill="currentColor" d="M55.977 81.512c0 8.038-6.516 14.555-14.555 14.555S26.866 89.55 26.866 81.512c0-8.04 6.517-14.556 14.556-14.556 8.039 0 14.555 6.517 14.555 14.556Zm24.745-5.822c0-.804.651-1.456 1.455-1.456h11.645c.804 0 1.455.652 1.455 1.455v11.645c0 .804-.651 1.455-1.455 1.455H82.177a1.456 1.456 0 0 1-1.455-1.455V75.689Zm68.411 5.822c0 8.038-6.517 14.555-14.556 14.555-8.039 0-14.556-6.517-14.556-14.555 0-8.04 6.517-14.556 14.556-14.556 8.039 0 14.556 6.517 14.556 14.556Z"/><rect width="168.667" height="125" x="3.667" y="3" stroke="currentColor" stroke-width="4" rx="20.289"/></svg>
      </div>
    </header>

    <section id="message-hints">
      <section id="message">
        <span id="message-icon">
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="24" height="24" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 7v6m0 4.01.01-.011M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"/></svg>
        </span>
        <div id="message-content"></div>
      </section>
      <section id="hint">
        <span id="hint-icon">
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="24" height="24" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m21 2-1 1M3 2l1 1m17 13-1-1M3 16l1-1m5 3h6m-5 3h4M12 3C8 3 5.952 4.95 6 8c.023 1.487.5 2.5 1.5 3.5S9 13 9 15h6c0-2 .5-2.5 1.5-3.5h0c1-1 1.477-2.013 1.5-3.5.048-3.05-2-5-6-5Z"/></svg>
        </span>
        <div id="hint-content"></div>
      </section>
    </section>

		<section id="code">
			<header>
				<h2></h2>
			</header>
			<div id="code-content"></div>
		</section>

    <section id="stack">
      <h2>Stack Trace</h2>
      <div id="stack-content"></div>
    </section>
  </div>
</div>
`;

const openNewWindowIcon =
	/* html */
	'<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="16" height="16" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 2h-4m4 0L8 8m6-6v4"/><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M14 8.667V12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h3.333"/></svg>';

// Make HTMLElement available in non-browser environments
const { HTMLElement = class {} as typeof globalThis.HTMLElement } = globalThis;
class ErrorOverlay extends HTMLElement {
	root: ShadowRoot;

	constructor(err: AstroErrorPayload['err']) {
		super();
		this.root = this.attachShadow({ mode: 'open' });
		this.root.innerHTML = overlayTemplate;

		this.text('#name', err.name);
		this.text('#title', err.title);
		this.text('#message-content', err.message, true);

		const hint = this.root.querySelector<HTMLElement>('#hint');
		if (hint && err.hint) {
			this.text('#hint-content', err.hint, true);
			hint.style.display = 'flex';
		}

		const docslink = this.root.querySelector<HTMLElement>('#message');
		if (docslink && err.docslink) {
			docslink.appendChild(this.createLink(`See Docs Reference${openNewWindowIcon}`, err.docslink));
		}

		const code = this.root.querySelector<HTMLElement>('#code');
		if (code && err.loc.file) {
			code.style.display = 'block';
			const codeHeader = code.querySelector<HTMLHeadingElement>('#code header');
			const codeContent = code.querySelector<HTMLDivElement>('#code-content');

			if (codeHeader) {
				const cleanFile = err.loc.file.split('/').slice(-2).join('/');
				const fileLocation = [cleanFile, err.loc.line, err.loc.column].filter(Boolean).join(':');
				const absoluteFileLocation = [err.loc.file, err.loc.line, err.loc.column]
					.filter(Boolean)
					.join(':');

				const codeFile = codeHeader.getElementsByTagName('h2')[0];
				codeFile.textContent = fileLocation;
				codeFile.title = absoluteFileLocation;

				const editorLink = this.createLink(`Open in editor${openNewWindowIcon}`, undefined);
				editorLink.onclick = () => {
					fetch('/__open-in-editor?file=' + encodeURIComponent(absoluteFileLocation));
				};

				codeHeader.appendChild(editorLink);
			}

			if (codeContent && err.highlightedCode) {
				codeContent.innerHTML = err.highlightedCode;

				window.requestAnimationFrame(() => {
					// NOTE: This cannot be `codeContent.querySelector` because `codeContent` still contain the old HTML
					const errorLine = this.root.querySelector<HTMLSpanElement>('.error-line');

					if (errorLine) {
						errorLine.scrollIntoView(true);

						// Add an empty line below the error line so we can show a caret under the error
						if (err.loc.column) {
							errorLine.insertAdjacentHTML(
								'afterend',
								`\n<span class="line error-caret"><span style="padding-left:${
									err.loc.column - 1
								}ch;">^</span></span>`
							);
						}
					}
				});
			}
		}

		this.text('#stack-content', err.stack);
	}

	text(selector: string, text: string | undefined, html = false) {
		if (!text) {
			return;
		}

		const el = this.root.querySelector(selector);

		if (el) {
			if (!html) {
				el.textContent = text.trim();
			} else {
				el.innerHTML = text.trim();
			}
		}
	}

	createLink(text: string, href: string | undefined) {
		const linkContainer = document.createElement('div');
		const linkElement = href ? document.createElement('a') : document.createElement('button');
		linkElement.innerHTML = text;

		if (href && linkElement instanceof HTMLAnchorElement) {
			linkElement.href = href;
			linkElement.target = '_blank';
		}

		linkContainer.appendChild(linkElement);
		linkContainer.className = 'link';

		return linkContainer;
	}
}

function getOverlayCode() {
	return `
		const overlayTemplate = \`${overlayTemplate}\`;
		const openNewWindowIcon = \`${openNewWindowIcon}\`;
		${ErrorOverlay.toString()}
	`;
}

export function patchOverlay(code: string) {
	return code.replace('class ErrorOverlay', getOverlayCode() + '\nclass ViteErrorOverlay');
}
