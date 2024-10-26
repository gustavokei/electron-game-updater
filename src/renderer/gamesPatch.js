const { ipcRenderer } = require("electron");
const fsPromises = require("fs").promises;
const { addCacheBustingSuffix } = require("./utils/addCacheBustingSuffix");
const { showText } = require("./utils/showText");
const { updateConfigJson } = require("./utils/updateConfigJson");
const { getFileNameFromUrl } = require("./utils/getFileNameFromUrl");
const { extract7zFile } = require("./utils/extract7zFile");
const { showDownloadProgress } = require("./utils/showDownloadProgress");
const { showExtractProgress } = require("./utils/showExtractProgress");
const { showError } = require("./utils/showError");
const isDevelopment = process.env.NODE_ENV !== "production";

module.exports = {
  gamesPatch: async (game, setIsUpdating) => {
    let startTime;
    const currentDir = ipcRenderer.sendSync("get-file-path", "");
    const configLocalPath = isDevelopment
      ? "launcher-config.json"
      : `${currentDir}\\launcher-config.json`;
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
      showText(`.btn-start.${game?.name}`, "Install");
      showText(`.txt-status.${game?.name}`, "Game is not yet installed");
    };

    const waitForClientUpdateClick = async () => {
      setIsUpdating(false);
      disabledButton.style.setProperty("display", "none");
      startButton.removeEventListener("click", handlePatchClick);
      startButton.addEventListener("click", handleInstallClick);
      showText(`.btn-start.${game?.name}`, "Download Client");
      showText(`.txt-status.${game?.name}`, "New Client available");
    };

    const handleInstallClick = async () => {
      disabledButton.style.display = "block";
      showText(`.btn-start.disabled.${game?.name}`, "Install");
      showText(`.txt-status.${game?.name}`, "Downloading Client");
      await updateClient();
    };

    const waitForPatchClick = async () => {
      setIsUpdating(false);
      disabledButton.style.setProperty("display", "none");
      startButton.removeEventListener("click", handleInstallClick);
      startButton.addEventListener("click", handlePatchClick);
      showText(`.btn-start.${game?.name}`, "Download Updates");
      showText(`.txt-status.${game?.name}`, "Updates available");
    };

    const handlePatchClick = async () => {
      disabledButton.style.display = "block";
      showText(`.btn-start.disabled.${game?.name}`, "Download Updates");
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
      setIsUpdating(true);
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
      ipcRenderer.send("download", {
        url: addCacheBustingSuffix(game?.clientUrl),
        options: {
          directory: `${currentDir}\\${game?.name}`,
          filename: getFileNameFromUrl(game?.clientUrl),
          step: "client",
        },
      });

      ipcRenderer.on("download client complete", async () => {
        showText(`.txt-status.${game?.name}`, "Extracting client");
        await extract7zFile(
          clientZipPath,
          `${currentDir}\\${game?.name}`,
          (progress) => {
            showExtractProgress(game, progress);
          }
        ).then(async () => {
          try {
            await fsPromises.access(clientZipPath);
            await fsPromises.unlink(clientZipPath); // Delete the file if it exists
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
        });
      });
    };

    const handlePatches = async () => {
      setIsUpdating(true);

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
            `Downloading patch ${patchIndex}`
          );

          try {
            await fsPromises.access(patchZipPath);
            await fsPromises.unlink(patchZipPath); // Delete the file if it exists
          } catch (error) {
            // File doesn't exist, continue
          }

          startTime = Date.now();
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
              `Extracting patch ${patchIndex}`
            );

            await extract7zFile(
              patchZipPath,
              `${currentDir}\\${game.name}`,
              (progress) => {
                showExtractProgress(game, progress);
              }
            ).then(async () => {
              await fsPromises.unlink(patchZipPath); // Delete the patch file after extraction
              showText(
                `.txt-status.${game.name}`,
                `Patch ${patchIndex} applied`
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
            });
          });
        } else {
          // Final update for the config with the latest patch version
          await updateConfigJson(
            "games",
            { name: game.name, patchVer: game.patchUrls.length }, // Final update after all patches
            configLocalPath
          );
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
      showText(`.txt-status.${game?.name}`, "Game is ready to play");
      showText(`.btn-start.${game?.name}`, "Play");
      showText(`.btn-start.disabled.${game?.name}`, "Play");
      showText(`.txt-progress.${game?.name}`, "");
      document
        .querySelector(`.total-bar.${game?.name}`)
        .style.setProperty("width", "100%");
      startButton.removeEventListener("click", handleInstallClick);
      startButton.removeEventListener("click", handlePatchClick);
      startButton.addEventListener("click", () => {
        const { spawn } = require("child_process");
        spawn(game.startCmd, {
          cwd: currentDir + `\\${game.name}\\`,
          detached: true,
          shell: true,
        });
        ipcRenderer.send("close-app");
      });
    };

    ipcRenderer.on("download progress", (event, status) => {
      showDownloadProgress(game, status, startTime);
    });

    ipcRenderer.on("download error", () => {
      showError(`Error while downloading a file`);
    });

    await init();
  },
};
