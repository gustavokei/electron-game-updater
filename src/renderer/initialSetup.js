const { ipcRenderer } = require("electron");
const { showError } = require("./utils/showError");
const { addCacheBustingSuffix } = require("./utils/addCacheBustingSuffix");
const { showText } = require("./utils/showText");
const { updateConfigJson } = require("./utils/updateConfigJson");
const { getFileNameFromUrl } = require("./utils/getFileNameFromUrl");
const isDevelopment = process.env.NODE_ENV !== "production";

module.exports = {
  initialSetup: async (configLocal, configRemote) => {
    const fs = require("fs");
    const currentDir = ipcRenderer.sendSync("get-file-path", "");
    const configLocalPath = isDevelopment
      ? "launcher-config.json"
      : `${currentDir}\\launcher-config.json`;

    const launcherNewPath = `${currentDir}\\${getFileNameFromUrl(
      configRemote?.launcherUrl
    )}`;
    const replaceScriptPath = `${currentDir}\\launcher-update.bat`;

    const updateLauncher = () => {
      return new Promise((resolve, reject) => {
        if (
          configRemote?.launcherVer > configLocal?.launcherVer &&
          !isDevelopment
        ) {
          showText(".initial-setup-text", "Downloading new launcher...");

          if (fs.existsSync(launcherNewPath)) {
            fs.unlinkSync(launcherNewPath);
          }

          ipcRenderer.send("download", {
            url: addCacheBustingSuffix(configRemote?.launcherUrl),
            options: {
              directory: currentDir,
              step: "launcher",
            },
          });

          ipcRenderer.on("download launcher complete", () => {
            updateConfigJson(
              "launcherVer",
              configRemote.launcherVer,
              configLocalPath
            );
            replaceExecutable();
          });

          ipcRenderer.on("download error", () => {
            reject("Error while downloading new launcher");
          });
        } else {
          showText(".initial-setup-text", "Launcher already updated");
          document
            .querySelector(".initial-setup")
            .style.setProperty("display", "none");
          resolve(true);
        }
      });
    };

    const replaceExecutable = () => {
      const replaceScriptContent = `
      @echo off
      setlocal
      set currentDir=%~dp0
      set launcherExe=%currentDir%launcher.exe
      set newLauncher=%currentDir%${getFileNameFromUrl(
        configRemote?.launcherUrl
      )}
      set sevenZipBin=%currentDir%7za.exe
    
      taskkill /IM launcher.exe /F >nul 2>&1
      del /F /Q "%launcherExe%" >nul 2>&1
      if exist "%newLauncher%" (
          "%sevenZipBin%" x "%newLauncher%" -o"%currentDir%" -y >nul 2>&1
          start "" "%launcherExe%" >nul 2>&1
          del /F "%newLauncher%" >nul 2>&1
          del /F "${replaceScriptPath}" >nul 2>&1
      )
      exit /b
      `;

      if (fs.existsSync(replaceScriptPath)) {
        fs.unlinkSync(replaceScriptPath);
      }
      fs.writeFileSync(replaceScriptPath, replaceScriptContent, "utf8");

      const { spawn } = require("child_process");
      spawn(`start /min cmd.exe /C ${replaceScriptPath}`, {
        detached: true,
        shell: true,
      });
      ipcRenderer.send("close-app");
    };

    try {
      return await updateLauncher();
    } catch (e) {
      showError(e);
      return false;
    }
  },
};
