module.exports = {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: ['> 0.1%', 'IE 11'] // enforce `appearance: none;` is prefixed with -webkit and -moz
    }
  }
};
