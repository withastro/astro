# Astro Starter Kit: Static Pages with Runtime Middleware

```sh
npm create astro@latest -- --template static-with-middleware
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/static-with-middleware)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/static-with-middleware)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/static-with-middleware/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

This example demonstrates how to use middleware with statically generated pages using the Node adapter's `runMiddlewareOnRequest` option.

Features:

- ✅ 🔐 Authentication on static pages - Protect statically generated pages with cookie-based authentication
- ✅ 🚀 Best of both worlds - Get the performance of static pages with the security of runtime checks
- ✅ 🎯 No edge functions required - Runs on your Node.js server, not in a separate edge runtime

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   ├── content/
│   ├── layouts/
│   ├── pages/
│   ├── content.config.ts
│   └── middleware.ts
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

This example includes a complete authentication flow:

- **Login page** (`/login`) - Form-based login with demo credentials
- **Protected pages** (`/dashboard`, `/entries/secret-post`) - Require authentication
- **Auth API** (`/api/auth/login`, `/api/auth/logout`) - Handle login/logout with cookies
- **Middleware** (`src/middleware.ts`) - Checks `auth-token` cookie before serving protected pages

The Node adapter automatically skips middleware during prerendering, then runs it at request time when serving static files with full cookie/header access.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

After building, start the server with `node dist/server/entry.mjs` to test the authentication flow.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
