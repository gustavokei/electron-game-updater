const { showText } = require("./showText");

const showDownloadProgress = (game, status, startTime) => {
  const fileProgress = Math.floor(status.percent * 100);
  const transferredMB = (status.transferredBytes / (1024 * 1024)).toFixed(2);
  const totalMB = (status.totalBytes / (1024 * 1024)).toFixed(2);

  const gameContainer = document.getElementById(`game-container-${game?.name}`);
  if (!gameContainer) return;

  showText(
    `.txt-progress.${game?.name}`,
    `${fileProgress}% (${transferredMB}MB/${totalMB}MB)`
  );
  const progressBar = gameContainer.querySelector(`.total-bar.${game?.name}`);
  if (progressBar) {
    progressBar.style.setProperty("width", fileProgress + "%");
  }

  const elapsedSeconds = (Date.now() - startTime) / 1000;
  const downloadSpeed =
    elapsedSeconds > 0
      ? status.transferredBytes / (1024 * 1024) / elapsedSeconds
      : 0;
  const remainingBytes = status.totalBytes - status.transferredBytes;
  const timeRemaining =
    downloadSpeed > 0 ? remainingBytes / (downloadSpeed * 1024 * 1024) : 0;

  const timeRemainingStr = new Date(timeRemaining * 1000)
    .toISOString()
    .substr(11, 8);

  showText(
    `.txt-download-speed.${game?.name}`,
    `Download speed: ${downloadSpeed.toFixed(2)} MB/s`
  );
  showText(
    `.txt-time-remaining.${game?.name}`,
    `Time remaining: ${timeRemainingStr}`
  );

  if (fileProgress === 100) {
    showText(`.txt-progress.${game?.name}`, "");
    showText(`.txt-download-speed.${game?.name}`, "");
    showText(`.txt-time-remaining.${game?.name}`, "");
  }
};

module.exports = { showDownloadProgress };
