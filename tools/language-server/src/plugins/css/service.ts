import { getCSSLanguageService, getSCSSLanguageService, getLESSLanguageService, LanguageService, ICSSDataProvider } from 'vscode-css-languageservice';

const customDataProvider: ICSSDataProvider = {
  providePseudoClasses() {
    return [];
  },
  provideProperties() {
    return [];
  },
  provideAtDirectives() {
    return [];
  },
  providePseudoElements() {
    return [];
  },
};

const [css, scss, less] = [getCSSLanguageService, getSCSSLanguageService, getLESSLanguageService].map((getService) =>
  getService({
    customDataProviders: [customDataProvider],
  })
);

const langs = {
  css,
  scss,
  less,
};

export function getLanguage(kind?: string) {
  switch (kind) {
    case 'scss':
    case 'text/scss':
      return 'scss' as const;
    case 'less':
    case 'text/less':
      return 'less' as const;
    case 'css':
    case 'text/css':
    default:
      return 'css' as const;
  }
}

export function getLanguageService(kind?: string): LanguageService {
  const lang = getLanguage(kind);
  return langs[lang];
}
