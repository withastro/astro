import { encode } from 'html-entities';

interface ErrorTemplateOptions {
  /** a short description of the error */
  message: string;
  /** information about where the error occurred */
  stack?: string;
  /** HTTP error code */
  statusCode?: number;
  /** HTML <title> */
  tabTitle: string;
  /** page title */
  title: string;
  /** show user a URL for more info or action to take */
  url?: string;
}

/** Display internal 404 page (if user didn’t provide one) */
export function errorTemplate({ title, url, message, stack, statusCode, tabTitle }: ErrorTemplateOptions): string {
  let error = url ? message.replace(url, '') : message;
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
        line-height: 1.5;
        margin: 0;
      }
      .wrapper {
        padding-left: 2rem;
        padding-right: 2rem;
      }
      a {
        color: #ff5d01;
      }
      h1 {
        font-weight: 800;
        margin-top: 1rem;
        margin-bottom: 0;
      }
      pre {
        color: #999;
        font-size: 1.2em;
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
      <pre><code>${encode(error)}</code></pre>
      ${url ? `<a target="_blank" href="${url}">${url}</a>` : ''}
      <pre><code>${encode(stack)}</code></pre>
    </main>
  </body>
</html>
`;
}
