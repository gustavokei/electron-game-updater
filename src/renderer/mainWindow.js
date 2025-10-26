import React, { useEffect, useState } from "react";
import "./styles.scss";
const { ipcRenderer } = require("electron");
import { getConfigFileLocal } from "./utils/getConfigFileLocal.js";
import { showError } from "./utils/showError.js";
import { getSevenZipBinPath } from "./utils/getSevenZipBinPath";
import { getMessages, getLocale, setLocale } from "../utils/i18n";
import { LANGUAGES, LANGUAGE_DISPLAY_NAMES, LANGUAGE_TO_LOCALE, CONFIG } from "../constants";
import { validateAndFetchConfig } from "./utils/validateAndFetchConfig";
import { setupGames } from "./utils/setupGames";
import { handleGameClick } from "./utils/handleGameClick";
import { handleLanguageChange } from "./utils/handleLanguageChange";
import { handleVoicePackChange } from "./utils/handleVoicePackChange";
import { filterVoicePackOptions, isValidVoicePackForLanguage } from "./utils/filterVoicePackOptions";
const isDevelopment = process.env.NODE_ENV !== "production";

const MainWindow = () => {
  const { gamesPatch } = require("./gamesPatch.js");
  const [configLocal, setConfigLocal] = useState(null);
  const [configRemote, setConfigRemote] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [didFinishInitialSetup, setDidFinishInitialSetup] = useState(false);
  const [didFinishGamesSetup, setDidFinishGamesSetup] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(CONFIG.DEFAULT_LANGUAGE);
  const [selectedVoicePack, setSelectedVoicePack] = useState(CONFIG.DEFAULT_VOICE_PACK);
  const [currentLocale, setCurrentLocale] = useState(getLocale());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const sevenZipBinPath = getSevenZipBinPath();
    if (!sevenZipBinPath) {
      showError(getMessages(currentLocale).unableToFind7za);
      return;
    }
    const localConfig = getConfigFileLocal();
    setConfigLocal(localConfig);
  }, [currentLocale]);

  useEffect(() => {
    const validateAndFetchConfigAsync = async () => {
      if (configLocal) {
        const setupSuccessful = await validateAndFetchConfig(
          configLocal, 
          configLocalPath, 
          setConfigRemote, 
          setSelectedGame, 
          setSelectedLanguage, 
          setCurrentLocale, 
          setLocale, 
          setIsInitialized, 
          setSelectedVoicePack, 
          isInitialized, 
          selectedGame, 
          currentLocale
        );
        if (setupSuccessful) {
          setDidFinishInitialSetup(true);
        }
      }
    };

    if (configLocal) {
      validateAndFetchConfigAsync();
    }
  }, [configLocal]);

  const setupGamesAsync = async () => {
    await setupGames(configRemote, configLocalPath, setDidFinishGamesSetup, showError);
  };

  useEffect(() => {
    if (didFinishInitialSetup && configLocal && configRemote) {
      setupGamesAsync();
    }
  }, [didFinishInitialSetup, configLocal, configRemote]);

  const patchGames = async () => {
    try {
      for (const game of configRemote?.games || []) {
        await gamesPatch(game, setIsUpdating, game?.maintenance);
      }
    } catch (e) {
      showError(e);
    }
  };

  useEffect(() => {
    if (didFinishGamesSetup) {
      patchGames();
    }
  }, [didFinishGamesSetup]);

  // Update voice pack when game changes
  useEffect(() => {
    if (selectedGame && configLocal && isInitialized) {
      const currentGame = configLocal.games?.find(g => g.name === selectedGame);
      if (currentGame?.selectedVoicePack !== undefined) {
        setSelectedVoicePack(currentGame.selectedVoicePack);
      } else {
        setSelectedVoicePack(CONFIG.DEFAULT_VOICE_PACK);
      }
      
      // Refresh UI text when switching games
      refreshUIText();
    }
  }, [selectedGame, configLocal, isInitialized]);


  // Update UI language when selectedLanguage changes
  useEffect(() => {
    if (selectedLanguage) {
      const newLocale = LANGUAGE_TO_LOCALE[selectedLanguage] || CONFIG.DEFAULT_LOCALE;
      setCurrentLocale(newLocale);
      setLocale(newLocale);
      
      // Check if current voice pack is valid for the new language
      if (!isValidVoicePackForLanguage(selectedVoicePack, selectedLanguage)) {
        console.warn(`Current voice pack ${selectedVoicePack} is invalid for language ${selectedLanguage}, resetting to default`);
        setSelectedVoicePack(CONFIG.DEFAULT_VOICE_PACK);
        
        // Update the config file to reflect the change
        if (selectedGame && configLocal) {
          try {
            const fs = require('fs');
            const data = fs.readFileSync(configLocalPath, 'utf8');
            const config = JSON.parse(data);
            const gameIndex = config.games.findIndex(game => game.name === selectedGame);
            if (gameIndex !== -1) {
              config.games[gameIndex].selectedVoicePack = CONFIG.DEFAULT_VOICE_PACK;
              fs.writeFileSync(configLocalPath, JSON.stringify(config, null, 4), 'utf8');
            }
          } catch (error) {
            console.warn("Failed to update voice pack in config:", error);
          }
        }
      }
      
      // Refresh all UI text when language changes
      refreshUIText();
    }
  }, [selectedLanguage]);

  // Add click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close language dropdowns
      const languageDropdowns = document.querySelectorAll('.language-dropdown-options');
      languageDropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target) && !event.target.closest('.language-dropdown-selected')) {
          dropdown.style.display = 'none';
        }
      });

      // Close voice pack dropdowns
      const voicePackDropdowns = document.querySelectorAll('.voice-pack-dropdown-options');
      voicePackDropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target) && !event.target.closest('.language-dropdown-selected')) {
          dropdown.style.display = 'none';
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to refresh all UI text with current locale
  const refreshUIText = () => {
    if (selectedGame && configRemote) {
      const game = configRemote.games?.find(g => g.name === selectedGame);
      if (game) {
        // Re-run the gamesPatch to refresh all text
        const gamesPatchModule = require("./gamesPatch.js");
        gamesPatchModule.gamesPatch(game, setIsUpdating, game?.maintenance);
      }
    }
  };

  const currentDir = ipcRenderer.sendSync("get-file-path", "");
  const configLocalPath = isDevelopment
    ? CONFIG.FILE_NAME
    : `${currentDir}\\${CONFIG.FILE_NAME}`;

  const handleGameClickAsync = async (game) => {
    await handleGameClick(game, isUpdating, currentLocale, getMessages, setSelectedGame, setSelectedVoicePack, configLocalPath);
  };

  const handleLanguageChangeAsync = (language) => {
    handleLanguageChange(language, setSelectedLanguage, configLocalPath);
  };

  const handleVoicePackChangeAsync = (voicePack) => {
    handleVoicePackChange(voicePack, setSelectedVoicePack, selectedGame, configLocalPath, selectedLanguage);
  };

  return (
    <div className="container">
        <div className="initial-setup">
          <span className="initial-setup-text">
            {getMessages(currentLocale).initializing}
          </span>
        </div>
      <div className="side-menu">
        {configRemote?.games?.map((game) => (
          <div
            key={game?.name}
            className={`game-icon ${game?.name?.toLowerCase()} ${
              selectedGame === game?.name ? "selected" : ""
            }`}
            onClick={() => handleGameClickAsync(game)}
          ></div>
        ))}
      </div>
      <div className="patcher">
        {configRemote?.games?.map((game) => (
          <div
            key={game?.name}
            id={`game-container-${game?.name}`}
            className={`game-patcher ${game?.name?.toLowerCase()} ${
              selectedGame === game?.name ? "active" : ""
            }`}
          >
            <div className={`total-progress ${game?.name}`}>
              <div className={`total-mid ${game?.name}`}>
                <div className={`total-bar ${game?.name}`} />
              </div>
            </div>
            <span className={`txt-status ${game?.name} text`}></span>
            <span className={`txt-progress ${game?.name} text`}></span>
            <span className={`txt-download-speed ${game?.name} text`}></span>
            <span className={`txt-time-remaining ${game?.name} text`}></span>
            
            {/* Voice pack dropdown - only show if game has voice pack options */}
            {game?.voicePacks && game.voicePacks.length > 0 && (
              <div className={`language-selector voice-pack ${game?.name}`} key={`voice-${game?.name}-${selectedVoicePack}`}>
                <label htmlFor={`voice-pack-select-${game?.name}`}>
                  {getMessages(currentLocale).voicePack}:
                </label>
                <div className={`language-dropdown ${game?.name}`}>
                  <div className={`language-dropdown-selected ${isUpdating ? 'disabled' : ''}`} onClick={() => {
                    if (isUpdating) return; // Block interaction during updates
                    
                    // Close all other dropdowns first
                    const allLanguageDropdowns = document.querySelectorAll('.language-dropdown-options');
                    const allVoicePackDropdowns = document.querySelectorAll('.voice-pack-dropdown-options');
                    allLanguageDropdowns.forEach(d => d.style.display = 'none');
                    allVoicePackDropdowns.forEach(d => d.style.display = 'none');
                    
                    // Toggle current dropdown
                    const dropdown = document.querySelector(`.voice-pack-dropdown-options.${game?.name}`);
                    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                  }}>
                    {selectedVoicePack ? 
                      (filterVoicePackOptions(game.voicePacks, selectedLanguage)?.find(vp => vp.value === selectedVoicePack)?.label || selectedVoicePack) : 
                      getMessages(currentLocale).default
                    }
                    <span className="dropdown-arrow">▼</span>
                  </div>
                  <div className={`voice-pack-dropdown-options ${game?.name}`}>
                    <div
                      className={`language-option ${selectedVoicePack === '' ? 'selected' : ''}`}
                      onClick={() => {
                        handleVoicePackChangeAsync('');
                        document.querySelector(`.voice-pack-dropdown-options.${game?.name}`).style.display = 'none';
                      }}
                    >
                      {getMessages(currentLocale).default}
                    </div>
                    {filterVoicePackOptions(game.voicePacks, selectedLanguage).map((voicePack) => (
                      <div
                        key={voicePack.value}
                        className={`language-option ${selectedVoicePack === voicePack.value ? 'selected' : ''}`}
                        onClick={() => {
                          handleVoicePackChangeAsync(voicePack.value);
                          document.querySelector(`.voice-pack-dropdown-options.${game?.name}`).style.display = 'none';
                        }}
                      >
                        {voicePack.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Language dropdown - always show */}
            <div className={`language-selector ${game?.name}`} key={`lang-${game?.name}-${selectedLanguage}`}>
              <label htmlFor={`language-select-${game?.name}`}>
                {getMessages(currentLocale).language}:
              </label>
                <div className={`language-dropdown ${game?.name}`}>
                  <div className={`language-dropdown-selected ${isUpdating ? 'disabled' : ''}`} onClick={() => {
                    if (isUpdating) return; // Block interaction during updates
                    
                    // Close all other dropdowns first
                    const allLanguageDropdowns = document.querySelectorAll('.language-dropdown-options');
                    const allVoicePackDropdowns = document.querySelectorAll('.voice-pack-dropdown-options');
                    allLanguageDropdowns.forEach(d => d.style.display = 'none');
                    allVoicePackDropdowns.forEach(d => d.style.display = 'none');
                    
                    // Toggle current dropdown
                    const dropdown = document.querySelector(`.language-dropdown-options.${game?.name}.language`);
                    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                  }}>
                    {LANGUAGE_DISPLAY_NAMES[selectedLanguage]}
                    <span className="dropdown-arrow">▼</span>
                  </div>
                  <div className={`language-dropdown-options ${game?.name} language`}>
                  {Object.values(LANGUAGES).map((language) => (
                    <div
                      key={language}
                      className={`language-option ${selectedLanguage === language ? 'selected' : ''}`}
                      onClick={() => {
                        handleLanguageChangeAsync(language);
                        document.querySelector(`.language-dropdown-options.${game?.name}.language`).style.display = 'none';
                      }}
                    >
                      {LANGUAGE_DISPLAY_NAMES[language]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              className={`btn-start ${game?.name} ${game?.maintenance ? 'disabled' : ''}`}
              disabled={game?.maintenance}
            >
              {game?.maintenance ? getMessages(currentLocale).underMaintenance : 'Play'}
            </button>
            <button
              className={`btn-start disabled hidden ${game?.name}`}
            ></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainWindow;
