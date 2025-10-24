const { showText } = require("./showText");
const { getMessages, getLocale } = require("../../utils/i18n");

// Store last progress for smoothing
const lastProgress = {};

const showDownloadProgress = (game, status, startTime) => {
  const locale = getLocale();
  const messages = getMessages(locale);
  const rawProgress = status.percent * 100;
  
  // Smooth progress calculation to reduce jerky updates
  const gameKey = game?.name;
  if (!lastProgress[gameKey]) {
    lastProgress[gameKey] = { value: 0, lastUpdate: Date.now(), hasShownSpeed: false, hasShownProgress: false };
  }
  
  const now = Date.now();
  const timeDiff = now - lastProgress[gameKey].lastUpdate;
  
  // Only update if enough time has passed (throttle updates to every 100ms)
  if (timeDiff >= 100) {
    // Smooth the progress by averaging with previous value
    const smoothingFactor = 0.3;
    const smoothedProgress = lastProgress[gameKey].value + 
      (rawProgress - lastProgress[gameKey].value) * smoothingFactor;
    
    lastProgress[gameKey].value = smoothedProgress;
    lastProgress[gameKey].lastUpdate = now;
  }
  
  const fileProgress = Math.floor(lastProgress[gameKey].value);
  const transferredMB = (status.transferredBytes / (1024 * 1024)).toFixed(2);
  const totalMB = (status.totalBytes / (1024 * 1024)).toFixed(2);

  const gameContainer = document.getElementById(`game-container-${game?.name}`);
  if (!gameContainer) return;

  // Show progress text immediately on first update, then throttle to every 200ms
  if (!lastProgress[gameKey].hasShownProgress || timeDiff >= 200) {
    showText(
      `.txt-progress.${game?.name}`,
      `${fileProgress}% (${transferredMB}MB/${totalMB}MB)`
    );
    lastProgress[gameKey].hasShownProgress = true;
  }
  const progressBar = gameContainer.querySelector(`.total-bar.${game?.name}`);
  if (progressBar) {
    progressBar.style.setProperty("width", fileProgress + "%");
  }

  // Calculate speed and time immediately
  const elapsedSeconds = (Date.now() - startTime) / 1000;
  const minElapsedTime = 1; // Minimum 1 second before showing speed
  
  let downloadSpeed = 0;
  let timeRemaining = 0;
  let timeRemainingStr = "00:00:00";
  
  // Always calculate speed, but only show after minimum time
  if (elapsedSeconds > 0) {
    downloadSpeed = status.transferredBytes / (1024 * 1024) / elapsedSeconds;
    const remainingBytes = status.totalBytes - status.transferredBytes;
    timeRemaining = downloadSpeed > 0 ? remainingBytes / (downloadSpeed * 1024 * 1024) : 0;
    timeRemainingStr = new Date(timeRemaining * 1000).toISOString().substr(11, 8);
  }

  // Show immediately on first update, then throttle to every 500ms
  if (!lastProgress[gameKey].hasShownSpeed || timeDiff >= 500) {
    if (elapsedSeconds >= minElapsedTime) {
      showText(
        `.txt-download-speed.${game?.name}`,
        `${messages.downloadSpeed}: ${downloadSpeed.toFixed(2)} MB/s`
      );
      showText(
        `.txt-time-remaining.${game?.name}`,
        `${messages.timeRemaining}: ${timeRemainingStr}`
      );
    } else {
      // Show "Calculating..." while waiting for accurate data
      showText(
        `.txt-download-speed.${game?.name}`,
        `${messages.downloadSpeed}: ${messages.calculating}`
      );
      showText(
        `.txt-time-remaining.${game?.name}`,
        `${messages.timeRemaining}: ${messages.calculating}`
      );
    }
    lastProgress[gameKey].hasShownSpeed = true;
  }

  if (fileProgress === 100) {
    showText(`.txt-progress.${game?.name}`, "");
    showText(`.txt-download-speed.${game?.name}`, "");
    showText(`.txt-time-remaining.${game?.name}`, "");
  }
};

// Function to reset progress smoothing for a game
const resetProgressSmoothing = (game) => {
  if (game?.name && lastProgress[game.name]) {
    lastProgress[game.name] = { value: 0, lastUpdate: Date.now(), hasShownSpeed: false, hasShownProgress: false };
  }
};

module.exports = { showDownloadProgress, resetProgressSmoothing };
