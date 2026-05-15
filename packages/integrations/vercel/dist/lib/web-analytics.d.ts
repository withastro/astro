export type VercelWebAnalyticsConfig = {
	enabled: boolean;
};
export declare function getInjectableWebAnalyticsContent({
	mode,
}: {
	mode: 'development' | 'production';
}): Promise<
	| "\n\t\t\twindow.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\n\t\t\tvar script = document.createElement('script');\n\t\t\tscript.defer = true;\n\t\t\tscript.src = 'https://cdn.vercel-insights.com/v1/script.debug.js';\n\t\t\tvar head = document.querySelector('head');\n\t\t\thead.appendChild(script);\n\t\t"
	| "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\n\t\tvar script = document.createElement('script');\n\t\tscript.defer = true;\n\t\tscript.src = '/_vercel/insights/script.js';\n\t\tvar head = document.querySelector('head');\n\t\thead.appendChild(script);\n\t"
>;
