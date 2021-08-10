# Astro Starter Kit: Blog with Multiple Authors

Our Blog with Multiple Authors Template, is a working example of our Blog template being adapted to narrate the story of "Sancho Panza" and "Don Quixote". 

Here we display how you can use Astro to provide individual content for both Sancho Panza and Don Quixote. This is a great working example of our Collections API in action.
 
We hope you enjoy this with a small Santeria, remember to build responsibly...

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ SEO-friendly setup with canonical URLs and OpenGraph data
- ✅ Full Markdown support
- ✅ RSS 2.0 generation
- ✅ Sitemap.xml generation

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```
├── public/
│   ├── assets/
│   ├── blog.scss
│   ├── global.scss
│   ├── social.png
│   ├── social.jpg
│   └── favicon.ico
├── src/
│   ├── components/
│   │   └── MainHead.astro
│   │   └── Nav.astro
│   │   └── Pagination.astro
│   │   └── PostPreview.astro
│   └── layouts/
│   │   └── post.astro
│   └── pages/
│       ├── posts/
│       │   └── Series of Markdown files 
│       └── $author.astro
│       └── $posts.astro
│       └── about.astro
│       └── index.astro
└── package.json
```

Files located within the public directory are static assets such as; stylesheets, images, fonts files etc.

Located within the `src/` directory is the `components/` `layout/` and `pages/` directories.

The `src/components/` directory is where all you UI components are stored, this includes components from your framework of choice, whether they be:

- Astro Components
- React
- Preact
- Solid
- Svelte Or Vue.

 You can visit our [Astro Components](https://docs.astro.build/core-concepts/astro-components) page for more information on creating your own components.

Astro used [file-based routing](https://docs.astro.build/core-concepts/routing), this is done by having Astro look for `.astro` or `.md` files in the `src/pages/` directory. Each page is then exposed as a route based on its file name. 

To find out more about using [Pages with Astro](https://docs.astro.build/core-concepts/astro-pages) and how our file-based routing works.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command         | Action                                      |
|:----------------|:--------------------------------------------|
| `npm install`   | Installs dependencies                       |
| `npm run dev`   | Starts local dev server at `localhost:3000` |
| `npm run build` | Build your production site to `./dist/`     |

## 👀 Want to learn more?

This Template can be used as a solid platform to get your own Blog site up and running with little effort as possible. Or as a educational demonstration.

Regardless of your intentions, we simply wish for you to truly explore and learn how to get the most from Astro and this template has been created in such a way to allow you to do so.

Feel free to check [our documentation](https://github.com/snowpackjs/astro) if you get stuck or jump into our [Discord server](https://astro.build/chat) to speak with other Astronauts.
