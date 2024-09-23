const { ipcRenderer } = require("electron");
const fs = require("fs");
const filePath = ipcRenderer.sendSync("get-file-path", "");
const isDevelopment = process.env.NODE_ENV !== "production";

const defaultConfig = {
  updaterUrl: "https://your-updater-url/",
  launcherVer: 1,
  lastSelectedGame: "",
  games: [],
};

const getConfigFileLocal = () => {
  let configFileLocal;
  const configPath = isDevelopment
    ? "launcher-config.json"
    : `${filePath}/launcher-config.json`;

  try {
    configFileLocal = JSON.parse(fs.readFileSync(configPath));
    const missingFields = [];

    if (!configFileLocal.updaterUrl) {
      missingFields.push("updaterUrl");
    }
    if (!configFileLocal.launcherVer) {
      missingFields.push("launcherVer");
    }
    if (!configFileLocal.lastSelectedGame) {
      missingFields.push("lastSelectedGame");
    }
    if (!configFileLocal.games) {
      missingFields.push("games");
    }

    if (missingFields.length > 0) {
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      configFileLocal = defaultConfig;
    }
  } catch (error) {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    configFileLocal = defaultConfig; // Return the default config
  }

  return configFileLocal;
};

module.exports = { getConfigFileLocal };
