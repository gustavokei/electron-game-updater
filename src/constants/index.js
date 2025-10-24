// Default configuration object
export const DEFAULT_CONFIG = {
    updaterUrl: "https://updater.devgames.app/",
    launcherVer: 1,
    selectedGame: "",
    selectedLanguage: "",
    games: [],
  };

// Language constants
export const LANGUAGES = {
  EN: 'EN',
  PT: 'PT', 
  TW: 'TW'
};

// Language display names
export const LANGUAGE_DISPLAY_NAMES = {
  [LANGUAGES.EN]: 'English',
  [LANGUAGES.PT]: 'Português',
  [LANGUAGES.TW]: '中文'
};

// Language to locale mapping
export const LANGUAGE_TO_LOCALE = {
  [LANGUAGES.EN]: 'en',
  [LANGUAGES.PT]: 'pt',
  [LANGUAGES.TW]: 'tw'
};

// Locale to language mapping
export const LOCALE_TO_LANGUAGE = {
  'en': LANGUAGES.EN,
  'pt': LANGUAGES.PT,
  'tw': LANGUAGES.TW
};

// Configuration constants
export const CONFIG = {
  FILE_NAME: 'launcher-config.json',
  DEFAULT_LANGUAGE: LANGUAGES.EN,
  DEFAULT_VOICE_PACK: '',
  DEFAULT_LOCALE: 'en'
};

// Game parameter constants
export const GAME_PARAMS = {
  LANGUAGE_PLACEHOLDER: 'EGULANG'
};
