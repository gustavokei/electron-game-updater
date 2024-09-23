const { ipcRenderer } = require("electron");
const { updateConfigJson } = require("./utils/updateConfigJson");
const fs = require("fs").promises;
const isDevelopment = process.env.NODE_ENV !== "production";

module.exports = {
  gamesSetup: async (game) => {
    const currentDir = ipcRenderer.sendSync("get-file-path", "");
    const configLocalPath = isDevelopment
      ? "launcher-config.json"
      : `${currentDir}\\launcher-config.json`;

    const init = async () => {
      // Re-read the configLocal file each time before making changes
      const configData = await fs.readFile(configLocalPath, "utf8");
      const updatedConfigLocal = JSON.parse(configData); // Parse the latest version of the file

      const games = updatedConfigLocal?.games || [];
      const gameIsInConfig = games.some((g) => g?.name === game.name);
      const gameLocal = games.find((g) => g.name === game.name);

      if (
        !gameIsInConfig ||
        (gameIsInConfig && (gameLocal?.clientVer == null || gameLocal?.patchVer == null))
      ) {
        await updateConfigJson(
          "games",
          { name: game.name, clientVer: 0, patchVer: 0 },
          configLocalPath
        );
      }
    };

    await init();
  },
};
