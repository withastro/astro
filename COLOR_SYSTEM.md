# 🎨 Color System Documentation

## Overview
This Astro blog uses a comprehensive color system built with TailwindCSS, featuring a modern blue, purple, and pink palette with full dark mode support.

## Color Palettes

### 🔵 Primary Blue
Used for: Main brand identity, primary CTAs, links, and interactive elements

```css
blue-50: #eff6ff   /* Light backgrounds, subtle accents */
blue-100: #dbeafe  /* Hover states for light elements */
blue-200: #bfdbfe
blue-300: #93c5fd
blue-400: #60a5fa  /* Dark mode links */
blue-500: #3b82f6  /* Hover states */
blue-600: #2563eb  /* Primary buttons, active links */
blue-700: #1d4ed8  /* Button hover states */
blue-800: #1e40af
blue-900: #1e3a8a
```

**Usage Examples:**
- Primary CTA buttons: `bg-blue-600 hover:bg-blue-700`
- Links: `text-blue-600 dark:text-blue-400`
- Active navigation: `bg-blue-100 dark:bg-gray-800 text-blue-600`

### 💜 Purple
Used for: Gradients, accent elements, feature cards

```css
purple-50: #faf5ff   /* Light gradient backgrounds */
purple-100: #f3e8ff  /* Feature card backgrounds */
purple-200: #e9d5ff
purple-300: #d8b4fe
purple-400: #c084fc
purple-500: #a855f7
purple-600: #9333ea  /* Gradient text, brand accents */
purple-700: #7e22ce
purple-800: #6b21a8
purple-900: #581c87
```

**Usage Examples:**
- Hero gradient: `bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600`
- Logo text: `from-blue-600 to-purple-600`
- Feature cards: `from-purple-50 to-purple-100`

### 🌸 Pink
Used for: Secondary accents, gradient endpoints, feature highlights

```css
pink-50: #fdf2f8   /* Subtle backgrounds */
pink-100: #fce7f3  /* Feature card backgrounds */
pink-200: #fbcfe8
pink-300: #f9a8d4
pink-400: #f472b6
pink-500: #ec4899
pink-600: #db2777  /* Gradient accents */
pink-700: #be185d
pink-800: #9f1239
pink-900: #831843
```

**Usage Examples:**
- Hero title: `from-blue-600 via-purple-600 to-pink-600`
- Feature cards: `from-pink-50 to-pink-100`

### ⚫ Grayscale
Used for: Text, backgrounds, borders, and neutral UI elements

```css
gray-50: Light backgrounds (light mode)
gray-100: Hover states, subtle backgrounds
gray-200: Borders
gray-300: Secondary text (dark mode)
gray-400: Placeholder text, muted text
gray-500: Icons
gray-600: Secondary text (light mode)
gray-700: Borders (dark mode)
gray-800: Dark mode backgrounds, cards
gray-900: Primary backgrounds (dark mode), text (light mode)
```

## Color Usage Guidelines

### Component-Specific Colors

#### Header
- Background: `bg-white/90 dark:bg-gray-900/90`
- Logo: `from-blue-600 to-purple-600`
- Links: `text-gray-700 dark:text-gray-300`
- Hover: `hover:text-blue-600 dark:hover:text-blue-400`
- Active: `bg-blue-100 dark:bg-gray-800 text-blue-600`

#### Hero Section
- Background: `from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`
- Title Gradient: `from-blue-600 via-purple-600 to-pink-600`
- Primary CTA: `bg-blue-600 hover:bg-blue-700`
- Secondary CTA: Border `hover:border-blue-500`

#### Feature Cards
Three distinct gradients for visual variety:
1. Blue: `from-blue-50 to-blue-100` with `bg-blue-600` icon
2. Purple: `from-purple-50 to-purple-100` with `bg-purple-600` icon  
3. Pink: `from-pink-50 to-pink-100` with `bg-pink-600` icon

#### Blog Cards
- Background: `bg-white dark:bg-gray-800`
- Badge: `bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200`
- Hover title: `hover:text-blue-600 dark:hover:text-blue-400`
- Links: `text-blue-600 dark:text-blue-400`

#### Footer
- Background: `bg-gray-50 dark:bg-gray-900`
- Logo: `from-blue-600 to-purple-600`
- Links: `text-gray-600 dark:text-gray-400 hover:text-blue-600`

## Dark Mode Strategy

All colors are paired with dark mode alternatives using the `dark:` prefix:

```html
<!-- Light mode: blue-600, Dark mode: blue-400 -->
<a class="text-blue-600 dark:text-blue-400">

<!-- Light mode: white, Dark mode: gray-900 -->
<div class="bg-white dark:bg-gray-900">

<!-- Light mode: gray-600, Dark mode: gray-300 -->
<p class="text-gray-600 dark:text-gray-300">
```

### Dark Mode Color Shifts
- **Backgrounds:** white → gray-900, gray-50 → gray-800
- **Text:** gray-900 → gray-100, gray-600 → gray-300
- **Accents:** blue-600 → blue-400 (lighter for contrast)
- **Borders:** gray-200 → gray-700

## Accessibility

All color combinations meet WCAG 2.1 AA standards:
- Text contrast ratios: Minimum 4.5:1 for normal text
- Interactive elements: Clearly distinguishable focus states
- Dark mode: Inverted contrast ratios maintained

## Usage Tips

1. **Consistency**: Use blue for all primary actions across the site
2. **Gradients**: Reserve for hero sections and brand elements (logo, titles)
3. **Feature Cards**: Use the three-color palette (blue/purple/pink) to create visual variety
4. **Links**: Always pair with hover states for better UX
5. **Dark Mode**: Test all new components in both light and dark modes

## Legacy Support

Some legacy CSS variables remain in `global.css` for backward compatibility with the original Astro theme. These are gradually being phased out in favor of Tailwind utilities:

```css
--gray: 96, 115, 159
--gray-light: 229, 233, 240
--gray-dark: 34, 41, 57
```

## Configuration

All colors are defined in `tailwind.config.cjs`:

```javascript
colors: {
  primary: { ... },  // Sky blue palette
  blue: { ... },     // Standard blue palette
  purple: { ... },   // Purple accents
  pink: { ... },     // Pink accents
}
```

To modify colors, edit the configuration file and restart the dev server.

---

*Last updated: Color system audit and standardization*
