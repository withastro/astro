
module.exports = {
    darkMode: 'class',
    mode: "jit",
    purge: [
      'src/**/*.{astro,jsx,tsx}'
    ],
    theme: {
      extend: {
        screens: {
          "3xl": "1633px",
          "1.5xl": "1333px",
          'lt-2xl': { 'max': '1535px' },
          // => @media (max-width: 1535px) { ... }
  
          'lt-xl': { 'max': '1279px' },
          // => @media (max-width: 1279px) { ... }
  
          'lt-lg': { 'max': '1023px' },
          // => @media (max-width: 1023px) { ... }
  
          'lt-md': { 'max': '767px' },
          // => @media (max-width: 767px) { ... }
  
          'lt-sm': { 'max': '639px' },
          // => @media (max-width: 639px) { ... }
  
          'lt-xsm': { 'max': '339px' },
          // => @media (max-width: 639px) { ... }
        },
      },
    },
    /* ... */
  };