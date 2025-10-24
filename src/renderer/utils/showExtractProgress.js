const { showText } = require("./showText");

// Store last progress for smoothing
const lastExtractProgress = {};

const showExtractProgress = (game, progress) => {
  // progress.percent is already a percentage (0-1), convert to 0-100
  const rawProgress = Math.min(progress.percent * 100, 100);
  
  // Smooth progress calculation to reduce jerky updates
  const gameKey = game?.name;
  if (!lastExtractProgress[gameKey]) {
    lastExtractProgress[gameKey] = { value: 0, lastUpdate: Date.now() };
  }
  
  const now = Date.now();
  const timeDiff = now - lastExtractProgress[gameKey].lastUpdate;
  
  // Only update if enough time has passed (throttle updates to every 100ms)
  if (timeDiff >= 100) {
    // Smooth the progress by averaging with previous value
    const smoothingFactor = 0.4;
    const smoothedProgress = lastExtractProgress[gameKey].value + 
      (rawProgress - lastExtractProgress[gameKey].value) * smoothingFactor;
    
    // Ensure progress doesn't exceed 100%
    lastExtractProgress[gameKey].value = Math.min(smoothedProgress, 100);
    lastExtractProgress[gameKey].lastUpdate = now;
  }
  
  // Extract progress percentage
  const fileProgress = Math.floor(Math.min(lastExtractProgress[gameKey].value, 100));

  // Only update progress text if enough time has passed (throttle to every 200ms)
  if (timeDiff >= 200) {
    showText(`.txt-progress.${game?.name}`, `${fileProgress}%`);
  }
  
  document
    .querySelector(`.total-bar.${game?.name}`)
    .style.setProperty("width", Math.min(fileProgress, 100) + "%");

  // Update time remaining
  showText(`.txt-download-speed.${game?.name}`, "");
  showText(`.txt-time-remaining.${game?.name}`, "");

  if (fileProgress === 100) {
    showText(`.txt-progress.${game?.name}`, "");
    showText(`.txt-download-speed.${game?.name}`, "");
    showText(`.txt-time-remaining.${game?.name}`, "");
  }
};

// Function to reset progress smoothing for a game
const resetExtractProgressSmoothing = (game) => {
  if (game?.name && lastExtractProgress[game.name]) {
    lastExtractProgress[game.name] = { value: 0, lastUpdate: Date.now() };
  }
};

module.exports = { showExtractProgress, resetExtractProgressSmoothing };
