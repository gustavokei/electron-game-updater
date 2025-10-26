const { ipcRenderer } = require("electron");
const { showError } = require("./utils/showError");
const { addCacheBustingSuffix } = require("./utils/addCacheBustingSuffix");
const { showText } = require("./utils/showText");
const { updateConfigJson } = require("./utils/updateConfigJson");
const { getFileNameFromUrl } = require("./utils/getFileNameFromUrl");
const { CONFIG, LAUNCHER } = require("../constants");
const isDevelopment = process.env.NODE_ENV !== "production";

module.exports = {
  initialSetup: async (configLocal, configRemote) => {
    const fs = require("fs");
    const currentDir = ipcRenderer.sendSync("get-file-path", "");
    const configLocalPath = isDevelopment
      ? CONFIG.FILE_NAME
      : `${currentDir}\\${CONFIG.FILE_NAME}`;

    const launcherNew = `${getFileNameFromUrl(configRemote?.launcherUrl)}${LAUNCHER.NEW_SUFFIX}`;
    const launcherNewPath = `${currentDir}\\${launcherNew}`;
    const replaceScriptPath = `${currentDir}\\${LAUNCHER.UPDATE_BATCH_FILE}`;

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
              filename: `${launcherNew}`,
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
      set launcherExe=%currentDir%${LAUNCHER.EXECUTABLE_NAME}
      set newLauncher=%currentDir%${launcherNew}
    
      :: Kill the running launcher
      taskkill /IM ${LAUNCHER.EXECUTABLE_NAME} /F >nul 2>&1
    
      :: Wait for the launcher to close
      :waitLoop
      tasklist /FI "IMAGENAME eq ${LAUNCHER.EXECUTABLE_NAME}" 2>NUL | find /I "${LAUNCHER.EXECUTABLE_NAME}" >NUL
      if not errorlevel 1 (
          timeout /T 1 /NOBREAK >NUL
          goto waitLoop
      )
    
      :: Delete the old launcher executable
      del /F /Q "%launcherExe%" >nul 2>&1
    
      :: Rename the new launcher to ${LAUNCHER.EXECUTABLE_NAME}
      ren "%newLauncher%" "${LAUNCHER.EXECUTABLE_NAME}"
    
      :: Start the new launcher
      start "" "%launcherExe%" >nul 2>&1
    
      :: Clean up the batch file
      del /F "%~f0" >nul 2>&1
      exit /b
      `;

      if (fs.existsSync(replaceScriptPath)) {
        fs.unlinkSync(replaceScriptPath);
      }
      fs.writeFileSync(replaceScriptPath, replaceScriptContent, "utf8");

      const { spawn } = require("child_process");
      spawn(`start /min cmd.exe /C "${replaceScriptPath}"`, {
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
