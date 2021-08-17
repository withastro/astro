export const LANGUAGE_NAMES = {
    English: "en",
    Français: "fr",
    Español: "es"
};

export const KNOWN_LANGUAGES = Object.values(LANGUAGE_NAMES);
export const langPathRegex = new RegExp(`\/(${KNOWN_LANGUAGES.join("|")})\/`);
export const getLanguageDetails = () => {
    // @ts-ignore
    let newLangWithRegion = (window.navigator.userLanguage || window.navigator.language || 'en-US').substr(0, 5);
    let newLang = newLangWithRegion.substr(0, 2);

    let actualDest = window.location.pathname.replace(langPathRegex, "/");
    return {
        newLangWithRegion,
        newLang,
        langPathRegex,
        actualDest
    }
};