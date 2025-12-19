# Complete Setup Tutorial for Astro Blog Template

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Understanding the Structure](#understanding-the-structure)
4. [Customization Guide](#customization-guide)
5. [Adding Content](#adding-content)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: Version 18.0.0 or higher

  - Download from: https://nodejs.org/
  - Verify installation: `node --version`

- **Package Manager**: npm (comes with Node.js)

  - Verify: `npm --version`
  - Alternative: pnpm or yarn

- **Git**: For version control

  - Download from: https://git-scm.com/
  - Verify: `git --version`

- **Code Editor**: VS Code recommended
  - Download from: https://code.visualstudio.com/
  - Recommended extensions:
    - Astro
    - Tailwind CSS IntelliSense
    - Prettier
    - ESLint

---

## Getting Started

### Step 1: Clone the Repository

```bash
# Navigate to your projects directory
cd d:\GIT-Project

# Clone the Astro repository
git clone https://github.com/withastro/astro.git astro-blog

# Copy the blog example to a new project
# Windows PowerShell:
Copy-Item -Path "d:\GIT-Project\astro-blog\examples\blog" -Destination "d:\GIT-Project\my-astro-blog" -Recurse

# macOS/Linux:
# cp -r ./astro-blog/examples/blog ./my-astro-blog
```

### Step 2: Install Dependencies

```bash
# Navigate to your new project
cd my-astro-blog

# Install all dependencies
npm install

# This will install:
# - Astro framework
# - MDX support
# - Sitemap generator
# - RSS feed generator
# - TailwindCSS (if using improved version)
```

### Step 3: Start Development Server

```bash
# Start the dev server
npm run dev

# The site will be available at:
# http://localhost:4321
```

### Step 4: Verify Installation

Open your browser and navigate to `http://localhost:4321`. You should see:

- ✅ Homepage loads correctly
- ✅ Navigation works
- ✅ Blog posts are visible
- ✅ Dark mode toggle works (if using improved version)

---

## Understanding the Structure

### Project Directory Layout

```
my-astro-blog/
│
├── public/                    # Static assets (images, fonts, etc.)
│   ├── fonts/                # Custom fonts
│   └── blog-placeholder-*.jpg # Sample images
│
├── src/                      # Source code
│   ├── components/           # Reusable UI components
│   │   ├── BaseHead.astro   # HTML head component
│   │   ├── Header.astro     # Site header/navigation
│   │   ├── HeaderLink.astro # Navigation links
│   │   ├── Footer.astro     # Site footer
│   │   └── FormattedDate.astro # Date formatting
│   │
│   ├── content/             # Blog content
│   │   ├── blog/           # Blog posts folder
│   │   │   ├── first-post.md
│   │   │   ├── second-post.md
│   │   │   └── ...
│   │   └── config.ts       # Content collections config
│   │
│   ├── layouts/            # Page layouts
│   │   └── BlogPost.astro # Blog post layout
│   │
│   ├── pages/              # Route pages
│   │   ├── index.astro    # Homepage (/)
│   │   ├── about.astro    # About page (/about)
│   │   ├── blog/
│   │   │   ├── index.astro    # Blog listing (/blog)
│   │   │   └── [...slug].astro # Dynamic blog posts
│   │   └── rss.xml.js     # RSS feed
│   │
│   ├── styles/             # Global styles
│   │   └── global.css     # Global CSS
│   │
│   └── consts.ts          # Site constants
│
├── astro.config.mjs       # Astro configuration
├── tailwind.config.mjs    # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
└── README.md             # Project documentation
```

### Key Files Explained

#### `astro.config.mjs`

```javascript
export default defineConfig({
  site: "https://example.com", // Your production URL
  integrations: [
    mdx(), // MDX support
    sitemap(), // Auto-generate sitemap
    tailwind(), // TailwindCSS integration
  ],
});
```

#### `src/consts.ts`

```typescript
export const SITE_TITLE = "Your Blog Title";
export const SITE_DESCRIPTION = "Your blog description";
```

#### `package.json` Scripts

```json
{
  "dev": "astro dev", // Start dev server
  "build": "astro build", // Build for production
  "preview": "astro preview", // Preview production build
  "astro": "astro" // Run Astro CLI
}
```

---

## Customization Guide

### 1. Update Site Information

**File**: `src/consts.ts`

```typescript
// Change these values to match your site
export const SITE_TITLE = "My Awesome Blog";
export const SITE_DESCRIPTION = "Writing about tech, design, and life";
```

**File**: `astro.config.mjs`

```javascript
export default defineConfig({
  site: "https://yourdomain.com", // Your actual domain
  // ...
});
```

### 2. Customize Colors

**File**: `tailwind.config.mjs`

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Change these to your brand colors
        500: '#0ea5e9',  // Main color
        600: '#0284c7',  // Darker shade
        // ...
      },
    },
  },
},
```

### 3. Update Header/Navigation

**File**: `src/components/Header.astro`

```astro
<!-- Add/remove navigation links -->
<HeaderLink href="/">Home</HeaderLink>
<HeaderLink href="/blog">Blog</HeaderLink>
<HeaderLink href="/projects">Projects</HeaderLink>  <!-- New link -->
<HeaderLink href="/about">About</HeaderLink>
```

### 4. Modify Footer

**File**: `src/components/Footer.astro`

```astro
<!-- Update copyright -->
&copy; {today.getFullYear()} Your Name. All rights reserved.

<!-- Update social links -->
<a href="https://github.com/yourusername">GitHub</a>
<a href="https://twitter.com/yourusername">Twitter</a>
```

### 5. Change Fonts

**Option A: Use Google Fonts**

Add to `src/components/BaseHead.astro`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
  rel="stylesheet"
/>
```

Update `tailwind.config.mjs`:

```javascript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
},
```

**Option B: Use Custom Fonts**

1. Add font files to `public/fonts/`
2. Update `src/styles/global.css`:

```css
@font-face {
  font-family: "YourFont";
  src: url("/fonts/your-font.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

---

## Adding Content

### Creating a New Blog Post

1. **Create a new file** in `src/content/blog/`:

   ```
   my-new-post.md
   ```

2. **Add frontmatter** at the top:

   ```markdown
   ---
   title: "My Amazing Post"
   description: "A description of my post"
   pubDate: 2024-01-15
   heroImage: "/blog-placeholder-1.jpg"
   ---

   Your content starts here...
   ```

3. **Write content** using Markdown:

   ````markdown
   ## Heading 2

   Regular paragraph text.

   ### Heading 3

   - List item 1
   - List item 2

   **Bold text** and _italic text_.

   ```code
   Code block
   ```
   ````

   [Link text](https://example.com)

   ```

   ```

### Adding Images

**Method 1: Public Folder**

```markdown
![Alt text](/my-image.jpg)
```

- Place image in `public/` folder
- Reference with `/filename.jpg`

**Method 2: Relative to Content**

```markdown
![Alt text](./images/my-image.jpg)
```

- Create `src/content/blog/images/` folder
- Optimized automatically by Astro

### Using MDX (Advanced)

Create a `.mdx` file instead of `.md`:

```mdx
---
title: "Interactive Post"
---

import CustomComponent from "../../components/CustomComponent.astro";

## Regular Markdown

<CustomComponent prop="value" />

More content...
```

---

## Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with your static site.

### Deployment Options

#### 1. **Netlify** (Recommended)

1. Push code to GitHub
2. Connect repository to Netlify
3. Settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy!

#### 2. **Vercel**

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts

#### 3. **GitHub Pages**

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

#### 4. **Traditional Hosting**

1. Build: `npm run build`
2. Upload `dist/` folder contents
3. Point domain to uploaded files

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Error: Port 4321 is already in use

# Solution: Kill the process or use a different port
npm run dev -- --port 3000
```

#### Module Not Found

```bash
# Error: Cannot find module '@astrojs/...'

# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Build Errors

```bash
# Clear cache and rebuild
rm -rf .astro dist
npm run build
```

#### Images Not Loading

- Ensure images are in `public/` folder
- Use absolute paths: `/image.jpg` not `./image.jpg`
- Check file extensions match

#### Dark Mode Not Working

- Clear browser cache
- Check localStorage is enabled
- Verify Tailwind config has `darkMode: 'class'`

### Getting Help

- **Astro Docs**: https://docs.astro.build
- **Discord**: https://astro.build/chat
- **GitHub Issues**: https://github.com/withastro/astro/issues
- **Stack Overflow**: Tag with `astro`

---

## Next Steps

After setup, consider:

1. ✅ Customize colors and fonts
2. ✅ Write your first blog post
3. ✅ Add your profile photo
4. ✅ Update social media links
5. ✅ Set up analytics (Google Analytics, Plausible, etc.)
6. ✅ Add a custom domain
7. ✅ Create an About page
8. ✅ Set up a contact form
9. ✅ Add SEO metadata
10. ✅ Deploy to production!

---

## Additional Resources

### Learning Resources

- [Astro Documentation](https://docs.astro.build)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Markdown Guide](https://www.markdownguide.org)
- [MDX Documentation](https://mdxjs.com)

### Tools & Utilities

- [Astro VSCode Extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Prettier](https://prettier.io)
- [Astro Image Optimizer](https://docs.astro.build/en/guides/images/)

### Community

- [Astro Discord](https://astro.build/chat)
- [GitHub Discussions](https://github.com/withastro/astro/discussions)
- [Twitter: @astrodotbuild](https://twitter.com/astrodotbuild)

---

**Happy Blogging! 🚀**
