const handleVoicePackChange = (voicePack, setSelectedVoicePack, selectedGame, configLocalPath) => {
  setSelectedVoicePack(voicePack);
  
  // Save voice pack selection per game
  try {
    // Read current config first
    const fs = require('fs');
    const data = fs.readFileSync(configLocalPath, 'utf8');
    const config = JSON.parse(data);
    
    // Find and update the current game
    const gameIndex = config.games.findIndex(game => game.name === selectedGame);
    if (gameIndex !== -1) {
      config.games[gameIndex].selectedVoicePack = voicePack;
      
      // Write back to file
      fs.writeFileSync(configLocalPath, JSON.stringify(config, null, 4), 'utf8');
    }
  } catch (error) {
    console.warn("Failed to save voice pack selection:", error);
  }
};

module.exports = { handleVoicePackChange };
