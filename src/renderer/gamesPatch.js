const { ipcRenderer } = require("electron");
const fsPromises = require("fs").promises;
const { addCacheBustingSuffix } = require("./utils/addCacheBustingSuffix");
const { showText } = require("./utils/showText");
const { updateConfigJson } = require("./utils/updateConfigJson");
const { getFileNameFromUrl } = require("./utils/getFileNameFromUrl");
const { extract7zFile } = require("./utils/extract7zFile");
const { showDownloadProgress, resetProgressSmoothing } = require("./utils/showDownloadProgress");
const { showExtractProgress, resetExtractProgressSmoothing } = require("./utils/showExtractProgress");
const { showError } = require("./utils/showError");
const { getTranslatedText } = require("./utils/getTranslatedText");
const { CONFIG, GAME_PARAMS } = require("../constants");
const isDevelopment = process.env.NODE_ENV !== "production";

// Track download states to prevent duplicates
const downloadStates = {};
// Track start times for each game
const downloadStartTimes = {};

module.exports = {
  gamesPatch: async (game, setIsUpdating, maintenance = false) => {
    let startTime;
    const currentDir = ipcRenderer.sendSync("get-file-path", "");
    const configLocalPath = isDevelopment
      ? CONFIG.FILE_NAME
      : `${currentDir}\\${CONFIG.FILE_NAME}`;
    const configData = await fsPromises.readFile(configLocalPath, "utf8");
    const updatedConfigLocal = JSON.parse(configData);
    const gamesLocal = updatedConfigLocal?.games || [];
    const gameLocal = gamesLocal.find((g) => g.name === game.name);
    const startButton = document.querySelector(`.btn-start.${game?.name}`);
    const disabledButton = document.querySelector(
      `.btn-start.disabled.${game?.name}`
    );

    const waitForInstallClick = async () => {
      setIsUpdating(false);
      disabledButton.style.setProperty("display", "none");
      startButton.removeEventListener("click", handlePatchClick);
      startButton.addEventListener("click", handleInstallClick);
      showText(`.btn-start.${game?.name}`, getTranslatedText("install"));
      showText(`.txt-status.${game?.name}`, getTranslatedText("gameNotInstalled"));
    };

    const waitForClientUpdateClick = async () => {
      setIsUpdating(false);
      disabledButton.style.setProperty("display", "none");
      startButton.removeEventListener("click", handlePatchClick);
      startButton.addEventListener("click", handleInstallClick);
      showText(`.btn-start.${game?.name}`, getTranslatedText("downloadClient"));
      showText(`.txt-status.${game?.name}`, getTranslatedText("newClientAvailable"));
    };

    const handleInstallClick = async () => {
      disabledButton.style.display = "block";
      showText(`.btn-start.disabled.${game?.name}`, getTranslatedText("install"));
      showText(`.txt-status.${game?.name}`, getTranslatedText("downloadingClient"));
      await updateClient();
    };

    const waitForPatchClick = async () => {
      setIsUpdating(false);
      disabledButton.style.setProperty("display", "none");
      startButton.removeEventListener("click", handleInstallClick);
      startButton.addEventListener("click", handlePatchClick);
      showText(`.btn-start.${game?.name}`, getTranslatedText("downloadUpdates"));
      showText(`.txt-status.${game?.name}`, getTranslatedText("updatesAvailable"));
    };

    const handlePatchClick = async () => {
      disabledButton.style.display = "block";
      showText(`.btn-start.disabled.${game?.name}`, getTranslatedText("downloadUpdates"));
      await handlePatches();
    };

    const init = async () => {
      if (
        gameLocal?.clientVer === 0 &&
        game?.clientVer > gameLocal?.clientVer
      ) {
        waitForInstallClick();
      } else if (
        gameLocal?.clientVer > 0 &&
        game?.clientVer > gameLocal?.clientVer
      ) {
        waitForClientUpdateClick();
      } else if (game?.patchUrls?.length > gameLocal?.patchVer) {
        waitForPatchClick();
      } else {
        finish();
      }
    };

    const updateClient = async () => {
      // Check if download is already in progress
      if (downloadStates[`${game.name}_client`]) {
        return;
      }
      
      downloadStates[`${game.name}_client`] = true;
      setIsUpdating(true);
      // Reset progress smoothing for clean start
      resetProgressSmoothing(game);
      resetExtractProgressSmoothing(game);
      try {
        await fsPromises.access(`${currentDir}\\${game?.name}`);
      } catch (error) {
        await fsPromises.mkdir(`${currentDir}\\${game?.name}`, {
          recursive: true,
        });
      }

      const clientZipPath = `${currentDir}\\${game?.name}\\${getFileNameFromUrl(
        game.clientUrl
      )}`;

      try {
        await fsPromises.access(clientZipPath);
        await fsPromises.unlink(clientZipPath); // Delete the file if it exists
      } catch (error) {
        // File doesn't exist, continue
      }

      startTime = Date.now();
      downloadStartTimes[`${game.name}_client`] = startTime;
      ipcRenderer.send("download", {
        url: addCacheBustingSuffix(game?.clientUrl),
        options: {
          directory: `${currentDir}\\${game?.name}`,
          filename: getFileNameFromUrl(game?.clientUrl),
          step: "client",
        },
      });

      // Use once to prevent multiple listeners
      ipcRenderer.once("download client complete", async () => {
        showText(`.txt-status.${game?.name}`, getTranslatedText("extractingClient"));
        
        try {
          await extract7zFile(
            clientZipPath,
            `${currentDir}\\${game?.name}`,
            (progress) => {
              showExtractProgress(game, progress);
            }
          );
          
          // Clean up the downloaded file
          try {
            await fsPromises.access(clientZipPath);
            await fsPromises.unlink(clientZipPath);
          } catch (error) {
            // File doesn't exist, continue
          }
          
          await updateConfigJson(
            "games",
            { name: game.name, clientVer: game.clientVer, patchVer: 0 },
            configLocalPath
          );
          
          if (game?.patchUrls?.length > gameLocal?.patchVer) {
            handlePatches();
          } else {
            finish();
          }
        } catch (error) {
          console.error("Extraction error:", error);
          showError(getTranslatedText("errorDownloadingFile"));
          setIsUpdating(false);
        } finally {
          // Clear download state and start time
          downloadStates[`${game.name}_client`] = false;
          delete downloadStartTimes[`${game.name}_client`];
        }
      });
    };

    const handlePatches = async () => {
      // Check if patch download is already in progress
      if (downloadStates[`${game.name}_patches`]) {
        return;
      }
      
      downloadStates[`${game.name}_patches`] = true;
      setIsUpdating(true);
      // Reset progress smoothing for clean start
      resetProgressSmoothing(game);
      resetExtractProgressSmoothing(game);

      const patchesToDownload = game.patchUrls.slice(gameLocal.patchVer); // Only download patches that haven't been applied

      const update = async () => {
        if (patchesToDownload.length > 0) {
          const patchUrl = patchesToDownload[0];
          const patchIndex = gameLocal.patchVer + 1; // Track patch number being downloaded
          const patchZipPath = `${currentDir}\\${game.name}\\${patchUrl
            .split("/")
            .pop()}`; // Naming the patch file

          showText(
            `.txt-status.${game.name}`,
            getTranslatedText("downloadingPatch", { number: patchIndex })
          );

          // Reset progress smoothing for each new patch download
          resetProgressSmoothing(game);
          
          // Reset progress bar to 0% visually
          document.querySelector(`.total-bar.${game.name}`).style.setProperty("width", "0%");
          showText(`.txt-progress.${game.name}`, "0% (0MB/0MB)");

          // Force delete the patch file if it exists
          try {
            await fsPromises.access(patchZipPath);
            await fsPromises.unlink(patchZipPath);
            
            // Wait for file to be actually deleted
            let attempts = 0;
            const maxAttempts = 10;
            while (attempts < maxAttempts) {
              try {
                await fsPromises.access(patchZipPath);
                // File still exists, wait a bit and try again
                await new Promise(resolve => setTimeout(resolve, 50));
                attempts++;
              } catch (error) {
                // File is gone, we can proceed
                break;
              }
            }
          } catch (error) {
            // File doesn't exist, continue
          }

          startTime = Date.now();
          downloadStartTimes[`${game.name}_patch`] = startTime;
          ipcRenderer.send("download", {
            url: addCacheBustingSuffix(patchUrl),
            options: {
              directory: `${currentDir}\\${game.name}`,
              filename: patchUrl.split("/").pop(), // Correct filename based on patchUrl
              step: "patch",
            },
          });

          ipcRenderer.once("download patch complete", async () => {
            showText(
              `.txt-status.${game.name}`,
              getTranslatedText("extractingPatch", { number: patchIndex })
            );

            try {
              await extract7zFile(
                patchZipPath,
                `${currentDir}\\${game.name}`,
                (progress) => {
                  showExtractProgress(game, progress);
                }
              );
              
              // Clean up the patch file
              await fsPromises.unlink(patchZipPath);
              
              showText(
                `.txt-status.${game.name}`,
                getTranslatedText("patchApplied", { number: patchIndex })
              );

              // Update the patch version in config after applying the patch
              await updateConfigJson(
                "games",
                { name: game.name, patchVer: patchIndex }, // Update to the current patch index
                configLocalPath
              );

              patchesToDownload.shift(); // Remove the completed patch
              gameLocal.patchVer = patchIndex; // Update local patch version
              update(); // Process the next patch
            } catch (error) {
              console.error("Patch extraction error:", error);
              showError(getTranslatedText("errorDownloadingFile"));
              // Don't enable button on error - keep it disabled until all patches are done
            } finally {
              // Clear patch download state and start time
              downloadStates[`${game.name}_patches`] = false;
              delete downloadStartTimes[`${game.name}_patch`];
            }
          });
        } else {
          // Final update for the config with the latest patch version
          await updateConfigJson(
            "games",
            { name: game.name, patchVer: game.patchUrls.length }, // Final update after all patches
            configLocalPath
          );
          // Clear patch download state and start time
          downloadStates[`${game.name}_patches`] = false;
          delete downloadStartTimes[`${game.name}_patch`];
          finish();
        }
      };

      // Start the update process if there are patches to download
      if (patchesToDownload.length > 0) {
        update();
      } else {
        finish();
      }
    };

    const finish = () => {
      setIsUpdating(false);
      disabledButton.style.setProperty("display", "none");
      
      if (maintenance) {
        showText(`.txt-status.${game?.name}`, getTranslatedText("underMaintenance"));
        showText(`.btn-start.${game?.name}`, getTranslatedText("underMaintenance"));
        showText(`.btn-start.disabled.${game?.name}`, getTranslatedText("underMaintenance"));
      } else {
        showText(`.txt-status.${game?.name}`, getTranslatedText("gameReady"));
        showText(`.btn-start.${game?.name}`, getTranslatedText("play"));
        showText(`.btn-start.disabled.${game?.name}`, getTranslatedText("play"));
      }
      
      showText(`.txt-progress.${game?.name}`, "");
      document
        .querySelector(`.total-bar.${game?.name}`)
        .style.setProperty("width", "100%");
      startButton.removeEventListener("click", handleInstallClick);
      startButton.removeEventListener("click", handlePatchClick);
      startButton.addEventListener("click", async () => {
        const { spawn } = require("child_process");
        
        // Get the selected language from the config
        const configLocalPath = isDevelopment
          ? CONFIG.FILE_NAME
          : `${currentDir}\\${CONFIG.FILE_NAME}`;
        const configData = await fsPromises.readFile(configLocalPath, "utf8");
        const config = JSON.parse(configData);
        const selectedLanguage = config.selectedLanguage || CONFIG.DEFAULT_LANGUAGE;
        
        // Get the selected voice pack from the current game's config
        const currentGame = config.games?.find(g => g.name === game.name);
        const selectedVoicePack = currentGame?.selectedVoicePack || CONFIG.DEFAULT_VOICE_PACK;
        
        // Replace language placeholder in startCmd if it exists
        let finalStartCmd = game.startCmd;
        if (game.startCmd && game.startCmd.includes(GAME_PARAMS.LANGUAGE_PLACEHOLDER)) {
          let languageParam = selectedLanguage;
          if (selectedVoicePack && selectedVoicePack !== '') {
            languageParam = `${selectedLanguage}_${selectedVoicePack}`;
          }
          finalStartCmd = game.startCmd.replace(GAME_PARAMS.LANGUAGE_PLACEHOLDER, languageParam);
        }
        
        spawn(finalStartCmd, {
          cwd: currentDir + `\\${game.name}\\`,
          detached: true,
          shell: true,
        });
        ipcRenderer.send("close-app");
      });
    };

    // Remove any existing listeners first to prevent duplicates
    ipcRenderer.removeAllListeners("download progress");
    ipcRenderer.removeAllListeners("download error");
    
    ipcRenderer.on("download progress", (event, status) => {
      // Get the appropriate start time for this game
      const clientStartTime = downloadStartTimes[`${game.name}_client`];
      const patchStartTime = downloadStartTimes[`${game.name}_patch`];
      const currentStartTime = clientStartTime || patchStartTime || Date.now();
      showDownloadProgress(game, status, currentStartTime);
    });

    ipcRenderer.on("download error", () => {
      showError(getTranslatedText("errorDownloadingFile"));
    });

    await init();
  },
};
