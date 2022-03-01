const FONT_FAMILY_BASE = [
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "Oxygen",
  "Ubuntu",
  "Cantarell",
  "Open Sans",
  "Helvetica Neue",
  "sans-serif",
];

module.exports = {
  corePlugins: {
    container: false,
  },
  content: ["./src/**/*.{astro,html,js,jsx,svelte,ts,tsx,vue}"],
  theme: {
    colors: {
      white: "#fff",
      black: "#000",
      transparent: "transparent",
      tan: "#f4efed",
      dawn: "#f3e9fa",
      dusk: "#514375",
      midnight: "#31274a",
      blue: "#205eff",
      red: "#ff5050",
      yellow: "#ffd542",
      purple: "#af43ff",
      pink: "#fdb2b7",
      pop: {
        1: "linear-gradient(180deg, #205eff 0%, #c238bd 115%)",
      },
    },
    fontFamily: {
      body: FONT_FAMILY_BASE,
      display: ["RT Alias Medium", ...FONT_FAMILY_BASE],
      mono: [
        "Menlo",
        "Monaco",
        "Lucida Console",
        "Liberation Mono",
        "DejaVu Sans Mono",
        "Bitstream Vera Sans Mono",
        "Courier New",
        "monospace",
      ],
    },
    fontSize: {
      xs: "clamp(0.7rem, 0.66rem + 0.2vw, 0.8rem)",
      sm: "clamp(0.88rem, 0.83rem + 0.24vw, 1rem)",
      base: "clamp(1.09rem, 1rem + 0.47vw, 1.33rem)",
      lg: "clamp(1.37rem, 1.21rem + 0.8vw, 1.78rem)",
      xl: "clamp(1.71rem, 1.45rem + 1.29vw, 2.37rem)",
      "2xl": "clamp(2.14rem, 1.74rem + 1.99vw, 3.16rem)",
      "3xl": "clamp(2.67rem, 2.07rem + 3vw, 4.21rem)",
      "4xl": "clamp(3.34rem, 2.45rem + 4.43vw, 5.61rem)",
    },
    extend: {
      typography: ({ theme }) => {
        const headings = {
          "h1, h2, h3, h4, h5, h6": {
            fontFamily: "var(--font-display)",
            fontWeight: "bold",
            lineHeight: 1.1,
            textAlign: "inherit"
          },
          h1: {
            fontSize: theme("fontSize.3xl"),
          },
          h2: {
            fontSize: theme("fontSize.2xl"),
          },
          h3: {
            fontSize: theme("fontSize.xl"),
          },
          h4: {
            fontSize: theme("fontSize.lg"),
          },
          h5: {
            fontSize: theme("fontSize.sm"),
          },
          h6: {
            fontSize: theme("fontSize.xs"),
          },
        };

        return {
          DEFAULT: {
            css: {
              maxWidth: '75ch',
              fontSize: "var(--size-500)",
              lineHeight: "1.5",
              // override @tailwindcss/typography colors
              "--tw-prose-body": theme("colors.midnight"),
              "--tw-prose-headings": theme("colors.dusk"),
              "--tw-prose-links": theme("colors.blue"),
              "--tw-prose-code": theme("colors.purple"),
              "--tw-prose-pre-bg":
                "linear-gradient(to bottom,var(--color-midnight),#1f1638)",
              "--tw-prose-pre-code": theme("colors.white"),
              "--tw-prose-bullets": "rgba(var(--color-midnight-rgb), 0.5)",
              ":focus-visible": {
                outline: "2px dashed var(--color-blue)",
              },
              ...headings,
              a: {
                textDecoration: "none",
                fontWeight: 400,
                wordBreak: "break-word",
                "&:hover": {
                  textDecoration: "underline",
                },
                "> code": {
                  color: "var(--tw-prose-code)",
                },
              },
            },
          },
          sm: {
            ...headings,
          },
          md: {
            ...headings,
          },
          lg: {
            ...headings,
          },
          xl: {
            ...headings,
          },
        };
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    function ({ addComponents, theme }) {
      addComponents({
        ".container": {
          maxWidth: "40rem",
          marginLeft: "auto",
          marginRight: "auto",
          "@screen md": { maxWidth: "50rem" },
          "@screen lg": { maxWidth: "62rem" },
          "@screen xl": { maxWidth: "80rem" },
          "@screen 2xl": { maxWidth: "90rem" },
        },
        ".head-md": {
          fontFamily: theme("fontFamily.display"),
          fontSize: theme("fontSize.xl"),
          letterSpacing: -0.5,
          lineHeight: 1.2,
          fontWeight: "bold"
        },
        ".body-md": {
          fontFamily: theme("fontFamily.body"),
          fontSize: theme("fontSize.body"),
          lineHeight: 1.3,
        }
      });
    },
  ],
};
