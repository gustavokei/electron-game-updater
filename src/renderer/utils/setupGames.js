const { gamesSetup } = require("../gamesSetup");
const fs = require('fs');

const setupGames = async (configRemote, configLocalPath, setDidFinishGamesSetup, showError) => {
  try {
    // Populate local config with games from remote config
    const data = fs.readFileSync(configLocalPath, 'utf8');
    const config = JSON.parse(data);
    
    // Add games from remote config to local config if they don't exist
    for (const remoteGame of configRemote?.games || []) {
      const existingGame = config.games?.find(g => g.name === remoteGame.name);
      if (!existingGame) {
        config.games.push({
          name: remoteGame.name,
          clientVer: 0,
          patchVer: 0
        });
      }
    }
    
    // Write updated config back
    fs.writeFileSync(configLocalPath, JSON.stringify(config, null, 4), 'utf8');
    
    for (const game of configRemote?.games || []) {
      await gamesSetup(game);
    }
    setDidFinishGamesSetup(true);
  } catch (e) {
    showError(e);
  }
};

module.exports = { setupGames };
