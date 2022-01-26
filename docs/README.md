# Astro Docs <img width="19.2" height="25.6" src="https://raw.githubusercontent.com/withastro/astro/main/assets/brand/logo.svg" alt="Astro logo">

## Contributing

### Pull Requests

Every pull request needs to be reviewed by another contributor to the documentation to help with the overall quality of the documentation.

## Running this project

- Clone the Project

  `git clone git@github.com:withastro/astro.git`
- Run `yarn install` to install latest dependencies.
  > This project uses yarn to manage dependencies. [Make sure that you have yarn v1 installed.](https://classic.yarnpkg.com/)
- Run `yarn workspace docs dev` to start the dev server.
- Run `yarn workspace docs build` to build the final site for production.
  > The environment variable `SNOWPACK_PUBLIC_GITHUB_TOKEN` must be set to a personal access token with `public_repo` permissions to prevent rate-limiting.

## Deploying

The site is automatically deployed when commits land in `latest`, via Netlify.

The "next" docs are automatically deployed when commits land in `main`, via Netlify at <https://main--astro-docs-2.netlify.app/getting-started/>.
