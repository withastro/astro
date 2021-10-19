# Astro Docs <img width="19.2" height="25.6" src="https://raw.githubusercontent.com/snowpackjs/astro/main/assets/brand/logo.svg" alt="Astro logo">

## Documentation Readiness

This branch `docs/v.21-preperations` is setup to provide a landing point to allow for adjustments and revisions to be made to the documentation regarding the new feature changes that would be brought over from `v0.21`.

Here developers working on the new release can provide code and their remarks and descriptions, allowing other contributors and those working on the documentations to continue their efforts.

This way we can ensure that the new documentation that pertains to the new features and api's can be written seperately without interfering with the current documentation that would be out-dated as of the anticipated release of `v0.21`. 

To make sure that users migrating between the two versions of Astro would be able to do so with pre-written guidance on how to do so, and how to utilise the new version fully.

I would ask those working on the translations of the docs to make branches from this, and to keep abreast of any changes that occur within this branch, as it would be the likely staging post for information pertaining to the new release.

Many Thanks Astronauts, lets get prepared for the launch of Astro `v0.21`



## Contributing

### Pull Requests

Every pull request needs to be reviewed by another contributor to the documentation to help with the overall quality of the documentation.

## Running this project

- Clone/Fork the project
- This project uses yarn to manage dependencies. [Make sure that you have yarn v1 installed.](https://classic.yarnpkg.com/)
- Run `yarn install` to install latest dependencies.
- Run `yarn dev` to start the dev server.
- Run `yarn build` to build the final site for production.

The environment variable `SNOWPACK_PUBLIC_GITHUB_TOKEN` must be set to a personal access token with `public_repo` permissions to prevent rate-limiting.
