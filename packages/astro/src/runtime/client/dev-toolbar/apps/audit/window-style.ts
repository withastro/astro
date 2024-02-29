export default `
.reset-button {
	text-align: left;
	border: none;
	margin: 0;
	width: auto;
	overflow: visible;
	background: transparent;
	font: inherit;
	line-height: normal;
	-webkit-font-smoothing: inherit;
	-moz-osx-font-smoothing: inherit;
	-webkit-appearance: none;
	padding: 0;
}

astro-dev-toolbar-window {
	left: initial;
	top: 8px;
	right: 8px;
	transform: none;
	width: 350px;
	min-height: 350px;
	max-height: 420px;
	padding: 0;
	overflow: hidden;
}

hr {
	margin: 0;
}

header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18px;
}

header > section {
	display: flex;
	align-items: center;
	gap: 1em;
}

#audit-counts {
	display: flex;
	gap: 1em;
}

#audit-counts > div {
	display: flex;
	gap: 8px;
	align-items: center;
}

h1 {
	font-size: 22px;
	font-weight: 600;
	color: #fff;
}

ul,
li {
	margin: 0;
	padding: 0;
	list-style: none;
}

h1,
h2 {
	margin: 0;
}

h3 {
	margin: 0;
	color: white;
	font-size: 17px;
}

.audit-header {
	display: flex;
	gap: 8px;
	align-items: center;
}

.audit-selector {
	color: white;
	font-size: 15px;
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
		'Courier New', monospace;
}

[active] .audit-selector:hover {
	text-decoration: underline;
	cursor: pointer;
}

.extended-info {
	display: none;
	color: white;
	font-size: 14px;
}

.extended-info hr {
	border: 1px solid rgba(27, 30, 36, 1);
}

.extended-info .audit-message {
	border-left: 4px solid rgba(27, 30, 36, 1);
	padding-left: 8px;
	font-style: italic;
}

[active] .extended-info {
	display: block;
}

astro-dev-toolbar-icon {
	color: white;
	fill: white;
	display: inline-block;
	height: 24px;
}

#audit-list {
	display: flex;
	flex-direction: column;
	gap: 0.25em;
	overflow: auto;
	overscroll-behavior: contain;
	height: 100%;
}

#back-to-list {
	display: none;
	align-items: center;
	gap: 8px;
	padding: 8px;
	color: white;
}

#back-to-list:hover {
	cursor: pointer;
	background-color: rgba(255, 255, 255, 0.3);
}

#audit-list:has(astro-dev-toolbar-card[active]) #back-to-list {
	display: flex;
}
`;
