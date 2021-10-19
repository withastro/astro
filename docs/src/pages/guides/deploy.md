---
layout: ~/layouts/MainLayout.astro
title: Deploy a Website
description: Multiple different methods to deploy a website with Astro.
---

The following guides are based on some shared assumptions:

- You are using the default build output location (`dist/`). This location [can be changed using the `dist` configuration option](/reference/configuration-reference).
- You are using npm. You can use equivalent commands to run the scripts if you are using Yarn or other package managers.
- Astro is installed as a local dev dependency in your project, and you have set up the following npm scripts:

```json
{
  "scripts": {
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

## Building The App

You may run `npm run build` command to build the app.

```bash
$ npm run build
```

By default, the build output will be placed at `dist/`. You may deploy this `dist/` folder to any of your preferred platforms.

## GitHub Pages

> **Warning:** By default, Github Pages will break the `_astro/` directory of your deployed website. To disable this behavior and fix this issue, make sure that you use the `deploy.sh` script below or manually add an empty `.nojekyll` file to your `public/` site directory.

1. Set the correct `buildOptions.site` in `astro.config.mjs`.
1. Inside your project, create `deploy.sh` with the following content (uncommenting the appropriate lines), and run it to deploy:

   ```bash{13,20,23}
   #!/usr/bin/env sh

   # abort on errors
   set -e

   # build
   npm run build

   # navigate into the build output directory
   cd dist

   # add .nojekyll to bypass GitHub Page's default behavior
   touch .nojekyll

   # if you are deploying to a custom domain
   # echo 'www.example.com' > CNAME

   git init
   git add -A
   git commit -m 'deploy'

   # if you are deploying to https://<USERNAME>.github.io
   # git push -f git@github.com:<USERNAME>/<USERNAME>.github.io.git main

   # if you are deploying to https://<USERNAME>.github.io/<REPO>
   # git push -f git@github.com:<USERNAME>/<REPO>.git main:gh-pages

   cd -
   ```

   > You can also run the above script in your CI setup to enable automatic deployment on each push.

### GitHub Actions

1. In the astro project repo, create `gh-pages` branch then go to Settings > Pages and set to `gh-pages` branch for GitHub Pages and set directory to `/` (root).
2. Set the correct `buildOptions.site` in `astro.config.mjs`.
3. Create the file `.github/workflows/main.yml` and add in the yaml below. Make sure to edit in your own details.
4. In GitHub go to Settings > Developer settings > Personal Access tokens. Generate a new token with repo permissions.
5. In the astro project repo (not \<YOUR USERNAME\>.github.io) go to Settings > Secrets and add your new personal access token with the name `API_TOKEN_GITHUB`.
6. When you push changes to the astro project repo CI will deploy them to \<YOUR USERNAME\>.github.io for you.

```yaml
# Workflow to build and deploy to your GitHub Pages repo.

# Edit your project details here.
# Remember to add API_TOKEN_GITHUB in repo Settings > Secrets as well!
env:
  githubEmail: <YOUR GITHUB EMAIL ADDRESS>
  deployToRepo: <NAME OF REPO TO DEPLOY TO (E.G. <YOUR USERNAME>.github.io)>

name: Github Pages Astro CI

on:
  # Triggers the workflow on push and pull request events but only for the main branch
  push:
    branches: [main]
  pull_request:
    branches: [main]

  # Allows you to run this workflow manually from the Actions tab.
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
      - uses: actions/checkout@v2

      # Install dependencies with npm
      - name: Install dependencies
        run: npm ci

      # Build the project and add .nojekyll file to supress default behaviour
      - name: Build
        run: |
          npm run build
          touch ./dist/.nojekyll

      # Push to your pages repo
      - name: Push to pages repo
        uses: cpina/github-action-push-to-another-repository@main
        env:
          API_TOKEN_GITHUB: ${{ secrets.API_TOKEN_GITHUB }}
        with:
          source-directory: 'dist'
          destination-github-username: ${{ github.actor }}
          destination-repository-name: ${{ env.deployToRepo }}
          user-email: ${{ env.githubEmail }}
          commit-message: Deploy ORIGIN_COMMIT
          target-branch: gh-pages
```

### Travis CI

1. Set the correct `buildOptions.site` in `astro.config.mjs`.
2. Create a file named `.travis.yml` in the root of your project.
3. Run `npm install` locally and commit the generated lockfile (`package-lock.json`).
4. Use the GitHub Pages deploy provider template, and follow the [Travis CI documentation](https://docs.travis-ci.com/user/deployment/pages/).

   ```yaml
   language: node_js
   node_js:
     - lts/*
   install:
     - npm ci
   script:
     - npm run build
   deploy:
     provider: pages
     skip_cleanup: true
     local_dir: dist
     # A token generated on GitHub allowing Travis to push code on you repository.
     # Set in the Travis settings page of your repository, as a secure variable.
     github_token: $GITHUB_TOKEN
     keep_history: true
     on:
       branch: master
   ```

## GitLab Pages

1. Set the correct `buildOptions.site` in `astro.config.mjs`.
2. Set `dist` in `astro.config.mjs` to `public` and `public` in `astro.config.mjs` to a newly named folder that is holding everything currently in `public`. The reasoning is because `public` is a second source folder in astro, so if you would like to output to `public` you'll need to pull public assets from a different folder. Your `astro.config.mjs` might end up looking like this:

```js
export default /** @type {import('astro').AstroUserConfig} */ ({
  // Enable the Preact renderer to support Preact JSX components.
  renderers: ['@astrojs/renderer-preact'],
  // files in `static/` will be blindly copied to `public/`
  public: 'static',
  // `public/` is where the built website will be output to
  dist: 'public',
  buildOptions: {
    sitemap: true,
    site: 'https://astro.build/',
  },
});
```

3. Create a file called `.gitlab-ci.yml` in the root of your project with the content below. This will build and deploy your site whenever you make changes to your content:

   ```yaml
   image: node:14
   pages:
     cache:
       paths:
         - node_modules/
     script:
       - npm install
       - npm run build
     artifacts:
       paths:
         - public
     only:
       - main
   ```

## Netlify

**Note:** If you are using an older [build image](https://docs.netlify.com/configure-builds/get-started/#build-image-selection) on Netlify, make sure that you set your Node.js version in either a [`.nvmrc`](https://github.com/nvm-sh/nvm#nvmrc) file (example: `node v14.17.6`) or a `NODE_VERSION` environment variable. This step is no longer required by default.

You can configure your deployment in two ways, via the Netlify website or with a local project `netlify.toml` file.

### `netlify.toml` file

Create a new `netlify.toml` file at the top level of your project repository with the following settings:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

Push the new `netlify.toml` file up to your hosted git repository. Then, set up a new project on [Netlify](https://netlify.com) for your git repository. Netlify will read this file and automatically configure your deployment.

### Netlify Website UI

You can skip the `netlify.toml` file and go directly to [Netlify](https://netlify.com) to configure your project. Netlify should now detect Astro projects automatically and pre-fill the configuration for you. Make sure that the following settings are entered before hitting the "Deploy" button:

- **Build Command:** `astro build` or `npm run build`
- **Publish directory:** `dist`

## Google Cloud

different from most available deploy options here, [Google Cloud](https://cloud.google.com) requires some UI clicks to deploy projects. (Most of these actions can also be done using the gcloud CLI).

### Cloud Run

1. Create a new GCP project, or select one you already have

2. Make sure the Cloud Run API is enabled

3. Create a new service

4. use a container from Docker Hub or build your own using [Cloud Build](https://cloud.google.com/build)

5. Configure a port from which the files are served

6. Enable public access by adding a new permission to `allUsers` called `Cloud Run Invoker`

### Cloud Storage

1. Create a new GCP project, or select one you already have

2. Create a new bucket under [Cloud Storage](https://cloud.google.com/storage)

3. give it a name and other required settings

4. Upload your `dist` folder into it or upload using [Cloud Build](https://cloud.google.com/build)

5. Enable public acces by adding a new permission to `allUsers` called `Storage Object Viewer`

6. Edit the website configuration and add `ìndex.html` as entrypoint and `404.html` as errorpage

## Google Firebase

1. Make sure you have [firebase-tools](https://www.npmjs.com/package/firebase-tools) installed.

2. Create `firebase.json` and `.firebaserc` at the root of your project with the following content:

   `firebase.json`:

   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": []
     }
   }
   ```

   `.firebaserc`:

   ```js
   {
    "projects": {
      "default": "<YOUR_FIREBASE_ID>"
    }
   }
   ```

3. After running `npm run build`, deploy using the command `firebase deploy`.

## Surge

1. First install [surge](https://www.npmjs.com/package/surge), if you haven't already.

2. Run `npm run build`.

3. Deploy to surge by typing `surge dist`.

You can also deploy to a [custom domain](http://surge.sh/help/adding-a-custom-domain) by adding `surge dist yourdomain.com`.

## Heroku

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).

2. Create a Heroku account by [signing up](https://signup.heroku.com).

3. Run `heroku login` and fill in your Heroku credentials:

   ```bash
   $ heroku login
   ```

4. Create a file called `static.json` in the root of your project with the below content:

   `static.json`:

   ```json
   {
     "root": "./dist"
   }
   ```

   This is the configuration of your site; read more at [heroku-buildpack-static](https://github.com/heroku/heroku-buildpack-static).

5. Set up your Heroku git remote:

   ```bash
   # version change
   $ git init
   $ git add .
   $ git commit -m "My site ready for deployment."

   # creates a new app with a specified name
   $ heroku apps:create example

   # set buildpack for static sites
   $ heroku buildpacks:set https://github.com/heroku/heroku-buildpack-static.git
   ```

6. Deploy your site:

   ```bash
   # publish site
   $ git push heroku master

   # opens a browser to view the Dashboard version of Heroku CI
   $ heroku open
   ```

## Vercel

To deploy your Astro project with a [Vercel for Git](https://vercel.com/docs/git), make sure it has been pushed to a Git repository.

Go to https://vercel.com/import/git and import the project into Vercel using your Git of choice (GitHub, GitLab or BitBucket). Follow the wizard to select the project root with the project's `package.json` and override the build step using `npm run build` and the output dir to be `./dist`

After your project has been imported, all subsequent pushes to branches will generate Preview Deployments, and all changes made to the Production Branch (commonly "main") will result in a Production Deployment.

Once deployed, you will get a URL to see your app live, such as the following: https://astro.vercel.app

## Azure Static Web Apps

You can deploy your Astro project with Microsoft Azure [Static Web Apps](https://aka.ms/staticwebapps) service. You need:

- An Azure account and a subscription key. You can create a [free Azure account here](https://azure.microsoft.com/free).
- Your app code pushed to [GitHub](https://github.com).
- The [SWA Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps) in [Visual Studio Code](https://code.visualstudio.com).

Install the extension in VS Code and navigate to your app root. Open the Static Web Apps extension, sign in to Azure, and click the '+' sign to create a new Static Web App. You will be prompted to designate which subscription key to use.

Follow the wizard started by the extension to give your app a name, choose a framework preset, and designate the app root (usually `/`) and built file location `/dist`. The wizard will run and will create a GitHub action in your repo in a `.github` folder.

The action will work to deploy your app (watch its progress in your repo's Actions tab) and, when successfully completed, you can view your app in the address provided in the extension's progress window by clicking the 'Browse Website' button that appears when the GitHub action has run.

## Cloudflare Pages

You can deploy your Astro project on [Cloudflare Pages](https://pages.cloudflare.com). You need:

- A Cloudflare account. If you don’t already have one, you can create a free Cloudflare account during the process.
- Your app code pushed to a [GitHub](https://github.com) repository.

Then, set up a new project on Cloudflare Pages.

Use the following build settings:

- **Framework preset**: `None` (As of this writing, Astro is not listed.)
- **Build command:** `astro build` or `npm run build`
- **Build output directory:** `dist`
- **Environment variables (advanced)**: Add an environment variable with the **Variable name** of `NODE_VERSION` and a **Value** of a [Node version that’s compatible with Astro](https://docs.astro.build/installation#prerequisites), since the Cloudflare Pages default version probably won’t work.

Then click the **Save and Deploy** button.

## Render

You can deploy your Astro project on [Render](https://render.com/) following these steps:

1. Create a [render.com account](https://dashboard.render.com/) and sign in
2. Click the **New +** button from your dashboard and select **Static Site**
3. Connect your [GitHub](https://github.com/) or [GitLab](https://about.gitlab.com/) repository or alternatively enter the public URL of a public repository
4. Give your website a name, select the branch and specify the build command and publish directory
   - **build command:** `npm run build`
   - **publish directory:** `dist`
5. Click the **Create Static Site** button

## Buddy

You can deploy your Astro project using [Buddy](https://buddy.works). To do so you'll need to:

1. Create a **Buddy** account [here](https://buddy.works/sign-up).
2. Create a new project and connect it with a git repository (GitHub, GitLab, BitBucket, any private Git Repository or you can use Buddy Git Hosting).
3. Add a new pipeline.
4. In the newly created pipeline add a **[Node.js](https://buddy.works/actions/node-js)** action.
5. In this action add:

   ```bash
   npm install
   npm run build
   ```

6. Add a deployment action - there are many to choose from, you can browse them [here](https://buddy.works/actions). Although their can settings differ, remember to set the **Source path** to `dist`.
7. Press the **Run** button.

## Credits

This guide was originally based off [Vite](https://vitejs.dev/)’s well-documented static deploy guide.
