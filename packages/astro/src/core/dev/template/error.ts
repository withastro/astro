import { encode } from 'html-entities';

interface ErrorTemplateOptions {
  statusCode?: number;
  tabTitle: string;
  title: string;
  message: string;
}

/** Display internal 404 page (if user didn’t provide one) */
export function errorTemplate({ title, message, statusCode, tabTitle }: ErrorTemplateOptions): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>${tabTitle}</title>
    <style>
      body {
        background-color: #101010;
        color: #d0d0d0;
        font-family: monospace;
        line-height: 1.6;
        margin: 0;
      }
      .wrapper {
        padding-left: 2rem;
        padding-right: 2rem;
      }
      h1 {
        font-weight: 800;
        margin-top: 1rem;
        margin-bottom: 0;
      }
      pre {
        color: #999;
        font-size: 1.4em;
        margin-top: 0;
        max-width: 60em;
      }
      .status {
        opacity: 0.7;
      }
    </style>
  </head>
  <body>
    <main class="wrapper">
      <h1>${statusCode ? `<span class="statusCode">${statusCode}</span> ` : ''}${title}</h1>
      <pre><code>${encode(message)}</code></pre>
    </main>
  </body>
</html>
`;
}
