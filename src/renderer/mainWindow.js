import React, { useEffect, useState } from "react";
import "./styles.scss";
const { ipcRenderer } = require("electron");
import { getConfigFileLocal } from "./utils/getConfigFileLocal.js";
import { showError } from "./utils/showError.js";
import { showWarn } from "./utils/showWarn.js";
import { getConfigFileRemote } from "./utils/getConfigFileRemote.js";
import { getSevenZipBinPath } from "./utils/getSevenZipBinPath";
const isDevelopment = process.env.NODE_ENV !== "production";
const { updateConfigJson } = require("./utils/updateConfigJson");

const MainWindow = () => {
  const { initialSetup } = require("./initialSetup.js");
  const { gamesSetup } = require("./gamesSetup.js");
  const { gamesPatch } = require("./gamesPatch.js");
  const [configLocal, setConfigLocal] = useState(null);
  const [configRemote, setConfigRemote] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [didFinishInitialSetup, setDidFinishInitialSetup] = useState(false);
  const [didFinishGamesSetup, setDidFinishGamesSetup] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const sevenZipBinPath = getSevenZipBinPath();
    if (!sevenZipBinPath) {
      showError("Unable to find 7za.exe");
      return;
    }
    const localConfig = getConfigFileLocal();
    setConfigLocal(localConfig);
  }, []);

  useEffect(() => {
    const validateAndFetchConfig = async () => {
      try {
        const remoteConfig = await getConfigFileRemote(configLocal.updaterUrl);
        if (!remoteConfig || remoteConfig.length === 0) {
          showError("Error while fetching remote config");
          return;
        }

        setConfigRemote(remoteConfig);
        if (configLocal?.lastSelectedGame?.length > 0) {
          setSelectedGame(configLocal?.lastSelectedGame);
        } else {
          setSelectedGame(remoteConfig?.games?.[0]?.name);
        }

        const setupSuccessful = await initialSetup(configLocal, remoteConfig);
        if (setupSuccessful) {
          setDidFinishInitialSetup(true);
        }
      } catch (error) {
        showError("Error fetching remote config: " + error.message);
      }
    };

    if (configLocal) {
      validateAndFetchConfig();
    }
  }, [configLocal]);

  const setupGames = async () => {
    try {
      for (const game of configRemote?.games || []) {
        await gamesSetup(game);
      }
      setDidFinishGamesSetup(true);
    } catch (e) {
      showError(e);
    }
  };

  useEffect(() => {
    if (didFinishInitialSetup && configLocal && configRemote) {
      setupGames();
    }
  }, [didFinishInitialSetup, configLocal, configRemote]);

  const patchGames = async () => {
    try {
      for (const game of configRemote?.games || []) {
        await gamesPatch(game, setIsUpdating);
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

  const currentDir = ipcRenderer.sendSync("get-file-path", "");
  const configLocalPath = isDevelopment
    ? "launcher-config.json"
    : `${currentDir}\\launcher-config.json`;

  const handleGameClick = (game) => {
    if (isUpdating) {
      showWarn("An update is currently in progress. Please wait.");
      return;
    }
    setSelectedGame(game?.name);
    updateConfigJson("lastSelectedGame", game?.name, configLocalPath);
  };

  return (
    <div className="container">
      <div className="initial-setup">
        <span className="initial-setup-text">Initializing...</span>
      </div>
      <div className="side-menu">
        {configRemote?.games?.map((game) => (
          <div
            key={game?.name}
            className={`game-icon ${game?.name?.toLowerCase()} ${
              selectedGame === game?.name ? "selected" : ""
            }`}
            onClick={() => handleGameClick(game)}
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
            <button className={`btn-start ${game?.name}`}>Play</button>
            <button
              className={`btn-start disabled ${game?.name}`}
              style={{ display: "none" }}
            ></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainWindow;
