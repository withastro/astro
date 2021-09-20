---
layout: ~/layouts/MainLayout.astro
title: Quick Start
---

```shell
# prerequisite: check that Node.js is 12.20.0+, 14.13.1+, or 16+
node --version

# Make a new project directory, and navigate directly into it
mkdir my-astro-project && cd $_

# prepare for liftoff...
npm init astro

# install dependencies
npm install

# start developing!
npm run dev

# when you're ready: build your static site to `dist/`
npm run build
```

To learn more about installing and using Astro for the first time, please [read our installation guide.](installation)

If you prefer to learn by example, check out our [complete library of examples](https://github.com/snowpackjs/astro/tree/main/examples) on GitHub. You can check out any of these examples locally by running `npm init astro -- --template "EXAMPLE_NAME"`.

## Start your project

From inside your project directory, enter the following command into your terminal:

```bash
npm run dev
```

Astro will now start serving your application on [http://localhost:3000](http://localhost:3000). Opening this URL in your browser, you should see the Astro's "Hello, World".

The server will listen for live file changes in your `src/` directory, so you do not need to restart the application as you make changes during development.

## Build your project

To build your project, from inside your directory enter the following build command into your terminal:

```bash
npm run build
```

This will instruct Astro to build your site and save it directly to disk. Your application is now ready in the `dist/` directory.

## Deploy your project

Astro sites are static, so they can be deployed to your favourite host:

- [AWS S3 bucket](https://aws.amazon.com/s3/)
- [Google Firebase](https://firebase.google.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)
- [Read more about deploying Astro in our Deploy guide.](/guides/deploy)

## Next Steps

Success! You're now ready to start developing!

We recommend that you to take some time to get more familiar with the way Astro works. You can do so by further exploring our Docs, we suggest that you consider the following:

📚 Learn more about Astro's project structure in our [Project Structure guide.](/core-concepts/project-structure)

📚 Learn more about Astro's component syntax in our [Astro Components guide.](/core-concepts/astro-components)

📚 Learn more about Astro's file-based routing in our [Routing guide.](core-concepts/astro-pages)
