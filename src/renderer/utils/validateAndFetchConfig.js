const { getConfigFileRemote } = require("./getConfigFileRemote");
const { updateConfigJson } = require("./updateConfigJson");
const { showError } = require("./showError");
const { initialSetup } = require("../initialSetup");
const { getMessages } = require("../../utils/i18n");
const { CONFIG, LANGUAGE_TO_LOCALE } = require("../../constants");
const fs = require('fs');

const validateAndFetchConfig = async (configLocal, configLocalPath, setConfigRemote, setSelectedGame, setSelectedLanguage, setCurrentLocale, setLocale, setIsInitialized, setSelectedVoicePack, isInitialized, selectedGame, currentLocale) => {
  try {
    const remoteConfig = await getConfigFileRemote(configLocal.updaterUrl);
    if (!remoteConfig || remoteConfig.length === 0) {
      showError(getMessages(currentLocale).errorFetchingRemoteConfig);
      return;
    }

    setConfigRemote(remoteConfig);
    if (configLocal?.selectedGame?.length > 0) {
      setSelectedGame(configLocal?.selectedGame);
    } else {
      updateConfigJson("selectedGame", remoteConfig?.games?.[0]?.name, configLocalPath);
      setSelectedGame(remoteConfig?.games?.[0]?.name);
    }

    // Set language from config or default (only on first load)
    if (!isInitialized) {
      if (configLocal?.selectedLanguage) {
        setSelectedLanguage(configLocal.selectedLanguage);
        // Also set the UI locale based on the saved language
        const savedLocale = LANGUAGE_TO_LOCALE[configLocal.selectedLanguage] || CONFIG.DEFAULT_LOCALE;
        setCurrentLocale(savedLocale);
        setLocale(savedLocale);
      } else {
        // Set default language and locale
        try {
          const data = fs.readFileSync(configLocalPath, 'utf8');
          const config = JSON.parse(data);
          config.selectedLanguage = CONFIG.DEFAULT_LANGUAGE;
          fs.writeFileSync(configLocalPath, JSON.stringify(config, null, 4), 'utf8');
        } catch (error) {
          console.warn("Failed to set default language:", error);
        }
        setSelectedLanguage(CONFIG.DEFAULT_LANGUAGE);
        setCurrentLocale(CONFIG.DEFAULT_LOCALE);
        setLocale(CONFIG.DEFAULT_LOCALE);
      }

      // Set voice pack from game-specific config or default
      const actualSelectedGame = configLocal?.selectedGame || remoteConfig?.games?.[0]?.name;
      const currentGame = configLocal?.games?.find(game => game.name === actualSelectedGame);
      if (currentGame?.selectedVoicePack !== undefined) {
        setSelectedVoicePack(currentGame.selectedVoicePack);
      } else {
        setSelectedVoicePack(CONFIG.DEFAULT_VOICE_PACK);
      }
      
      setIsInitialized(true);
    }

    const setupSuccessful = await initialSetup(configLocal, remoteConfig);
    return setupSuccessful;
  } catch (error) {
    showError(getMessages(currentLocale).errorFetchingConfig.replace("{error}", error.message));
    return false;
  }
};

module.exports = { validateAndFetchConfig };
