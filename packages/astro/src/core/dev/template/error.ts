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
          line-height: 1.5;
          margin: 0;
        }
        .wrapper {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100vw;
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
        .statusCode {
          color: #ff5d01;
        }
        .link {
          color: #ff5d01;
        }
      </style>
    </head>
    <body>
      <main class="wrapper">
        <svg class="logo astro-RnEq1mMV" width="120" height="120" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M163.008 18.929c1.944 2.413 2.935 5.67 4.917 12.181l43.309 142.27a180.277 180.277 0 00-51.778-17.53l-28.198-95.29a3.67 3.67 0 00-7.042.01l-27.857 95.232a180.225 180.225 0 00-52.01 17.557l43.52-142.281c1.99-6.502 2.983-9.752 4.927-12.16a15.999 15.999 0 016.484-4.798c2.872-1.154 6.271-1.154 13.07-1.154h31.085c6.807 0 10.211 0 13.086 1.157a16.004 16.004 0 016.487 4.806z" fill="white" class="svgRocket"></path>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M168.19 180.151c-7.139 6.105-21.39 10.268-37.804 10.268-20.147 0-37.033-6.272-41.513-14.707-1.602 4.835-1.961 10.367-1.961 13.902 0 0-1.056 17.355 11.015 29.426 0-6.268 5.081-11.349 11.349-11.349 10.743 0 10.731 9.373 10.721 16.977v.679c0 11.542 7.054 21.436 17.086 25.606a23.27 23.27 0 01-2.339-10.2c0-11.008 6.463-15.107 13.974-19.87 5.976-3.79 12.616-8.001 17.192-16.449a31.024 31.024 0 003.743-14.82c0-3.299-.513-6.479-1.463-9.463z" fill="#ff5d01" class="svgFlame"></path></svg>
        <h1>${statusCode ? `<span class="statusCode">${statusCode}: </span> ` : ''}<span class="statusMessage">${title}</span></h1>
        <pre>Path: ${encode(message)}</pre>
        </main>
    </body>
  </html>`;
}
