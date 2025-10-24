const { updateConfigJson } = require("./updateConfigJson");
const { showWarn } = require("./showWarn");
const { CONFIG } = require("../../constants");
const fs = require('fs');

const handleGameClick = async (game, isUpdating, currentLocale, getMessages, setSelectedGame, setSelectedVoicePack, configLocalPath) => {
  if (isUpdating) {
    showWarn(getMessages(currentLocale).updatingInProgress);
    return;
  }
  setSelectedGame(game?.name);
  
  // Re-read the local config to get the latest voice pack for this game
  try {
    const data = fs.readFileSync(configLocalPath, 'utf8');
    const config = JSON.parse(data);
    const currentGame = config.games?.find(g => g.name === game?.name);
    
    if (currentGame?.selectedVoicePack !== undefined) {
      setSelectedVoicePack(currentGame.selectedVoicePack);
    } else {
      setSelectedVoicePack(CONFIG.DEFAULT_VOICE_PACK);
    }
  } catch (error) {
    console.warn("Failed to read voice pack for game:", error);
    setSelectedVoicePack(CONFIG.DEFAULT_VOICE_PACK);
  }
  
  updateConfigJson("selectedGame", game?.name, configLocalPath);
};

module.exports = { handleGameClick };
