const { showText } = require("./showText");

const showExtractProgress = (game, progress) => {
  // Extract progress percentage
  const fileProgress = Math.floor(progress.percent) + 1;

  // Display progress
  showText(`.txt-progress.${game?.name}`, `${fileProgress}%`);
  document
    .querySelector(`.total-bar.${game?.name}`)
    .style.setProperty("width", fileProgress + "%");

  // Update time remaining
  showText(`.txt-download-speed.${game?.name}`, "");
  showText(`.txt-time-remaining.${game?.name}`, "");

  if (fileProgress === 100) {
    showText(`.txt-progress.${game?.name}`, "");
    showText(`.txt-download-speed.${game?.name}`, "");
    showText(`.txt-time-remaining.${game?.name}`, "");
  }
};

module.exports = { showExtractProgress };
